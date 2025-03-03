import { apiFetch } from './api.js';
import { showToast } from '../components/toast.js';

// Fetch course structure
async function fetchCourseStructure(courseId, state) {
    try {
        console.log('Fetching course structure for course ID:', courseId);
        const response = await apiFetch(`/api/core/course-structure/?course=${courseId}`, {}, state.token);
        console.log('Course structure API response:', response);
        
        if (response && response.length > 0) {
            return response[0].structure_data; // Return sections array
        }
        
        // If no structure exists, create a default structure from materials
        console.log('No structure found, creating from materials');
        const materials = await apiFetch(`/api/core/materials/?course=${courseId}`, {}, state.token);
        
        if (materials && materials.length > 0) {
            // Group materials by type
            const videoMaterials = materials.filter(m => m.file_type === 'video');
            const documentMaterials = materials.filter(m => m.file_type === 'document');
            const imageMaterials = materials.filter(m => m.file_type === 'image');
            const audioMaterials = materials.filter(m => m.file_type === 'audio');
            const otherMaterials = materials.filter(m => 
                !['video', 'document', 'image', 'audio'].includes(m.file_type));
            
            // Create a default structure
            const defaultStructure = [];
            
            if (videoMaterials.length > 0) {
                defaultStructure.push({
                    title: "Videos",
                    items: videoMaterials.map(m => ({ id: m.id, type: 'video' }))
                });
            }
            
            if (documentMaterials.length > 0) {
                defaultStructure.push({
                    title: "Documents",
                    items: documentMaterials.map(m => ({ id: m.id, type: 'document' }))
                });
            }
            
            if (imageMaterials.length > 0) {
                defaultStructure.push({
                    title: "Images",
                    items: imageMaterials.map(m => ({ id: m.id, type: 'image' }))
                });
            }
            
            if (audioMaterials.length > 0) {
                defaultStructure.push({
                    title: "Audio",
                    items: audioMaterials.map(m => ({ id: m.id, type: 'audio' }))
                });
            }
            
            if (otherMaterials.length > 0) {
                defaultStructure.push({
                    title: "Other Materials",
                    items: otherMaterials.map(m => ({ id: m.id, type: m.file_type }))
                });
            }
            
            console.log('Created default structure:', defaultStructure);
            return defaultStructure;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching course structure:', error);
        showToast('Failed to load course structure', 'danger');
        return [];
    }
}

// Fetch material details by ID
async function fetchMaterialDetails(materialId, state) {
    try {
        const material = await apiFetch(`http://127.0.0.1:8000/api/core/materials/${materialId}/`, {}, state.token);
        return material;
    } catch (error) {
        console.error(`Error fetching material ${materialId}:`, error);
        return null;
    }
}

// Format duration (e.g., 125 seconds -> "2:05")
function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Render the content page
export async function renderCourseContentPage(courseId, state) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="d-flex justify-content-center my-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    try {
        // Fetch course and structure
        const course = await apiFetch(`http://127.0.0.1:8000/api/core/courses/${courseId}/`, {}, state.token);
        const structure = await fetchCourseStructure(courseId, state);

        if (!structure || structure.length === 0) {
            content.innerHTML = `
                <div class="container mt-4">
                    <h1>${course.title}</h1>
                    <div class="alert alert-info">
                        This course doesn't have any content yet. Check back later!
                    </div>
                    <button class="btn btn-secondary mt-3" id="back-to-dashboard">Back to Dashboard</button>
                </div>
            `;
            document.getElementById('back-to-dashboard').addEventListener('click', () => {
                import('./student.js').then(module => module.renderStudentDashboard(state));
            });
            return;
        }

        // Fetch all materials in parallel
        const materialPromises = structure.flatMap(section => 
            section.items.map(item => fetchMaterialDetails(item.id, state))
        );
        const materials = await Promise.all(materialPromises);
        const materialMap = new Map(materials.filter(m => m).map(m => [m.id, m]));

        // Render the course content page
        content.innerHTML = `
            <div class="container-fluid mt-4">
                <div class="row">
                    <!-- Sidebar -->
                    <div class="col-md-3 course-sidebar">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">Course Content</h5>
                            </div>
                            <div class="list-group list-group-flush" id="course-nav">
                                ${structure.map((section, index) => `
                                    <div class="list-group-item list-group-item-action p-0">
                                        <div class="d-flex w-100 p-3 section-header" data-section="${index}">
                                            <div>
                                                <h6 class="mb-0">${section.title}</h6>
                                                <small>${section.items.length} items</small>
                                            </div>
                                            <i class="bi bi-chevron-down ms-auto"></i>
                                        </div>
                                        <div class="section-items" id="section-items-${index}">
                                            ${section.items.map((item, itemIndex) => {
                                                const material = materialMap.get(parseInt(item.id));
                                                if (!material) return '';
                                                
                                                let icon = '';
                                                switch (item.type) {
                                                    case 'video': icon = 'bi-play-circle'; break;
                                                    case 'document': icon = 'bi-file-earmark-text'; break;
                                                    case 'image': icon = 'bi-image'; break;
                                                    case 'audio': icon = 'bi-music-note'; break;
                                                    default: icon = 'bi-file-earmark'; break;
                                                }
                                                
                                                return `
                                                    <div class="list-group-item list-group-item-action border-0 ps-4 py-2 item-link" 
                                                         data-section="${index}" data-item="${itemIndex}">
                                                        <i class="bi ${icon} me-2"></i>
                                                        <span>${material.title}</span>
                                                        ${item.type === 'video' && material.video_details ? 
                                                            `<small class="text-muted ms-2">(${formatDuration(material.video_details.duration)})</small>` : ''}
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-secondary w-100" id="back-to-dashboard">Back to Dashboard</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Main content area -->
                    <div class="col-md-9">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="mb-0">${course.title}</h3>
                                <p class="text-muted mb-0">Taught by ${course.teacher_name || course.teacher.username}</p>
                            </div>
                            <div class="card-body" id="content-display">
                                <div class="text-center py-5">
                                    <h4>Welcome to ${course.title}</h4>
                                    <p>Select a lesson from the menu to begin learning.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for section headers
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const sectionIndex = header.getAttribute('data-section');
                const sectionItems = document.getElementById(`section-items-${sectionIndex}`);
                const icon = header.querySelector('i');
                
                if (sectionItems.style.display === 'block') {
                    sectionItems.style.display = 'none';
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                } else {
                    sectionItems.style.display = 'block';
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                }
            });
        });

        // Add event listeners for content items
        document.querySelectorAll('.item-link').forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                document.querySelectorAll('.item-link').forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Get section and item index
                const sectionIndex = item.getAttribute('data-section');
                const itemIndex = item.getAttribute('data-item');
                
                // Get the material
                const section = structure[sectionIndex];
                const itemData = section.items[itemIndex];
                const material = materialMap.get(parseInt(itemData.id));
                
                if (!material) {
                    showToast('Material not found', 'danger');
                    return;
                }
                
                // Display the content based on type
                const contentDisplay = document.getElementById('content-display');
                
                switch (itemData.type) {
                    case 'video':
                        contentDisplay.innerHTML = `
                            <h3>${material.title}</h3>
                            <div class="ratio ratio-16x9 mb-3">
                                <video controls class="rounded">
                                    <source src="${material.file_path}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            <div class="card mb-3">
                                <div class="card-header">Description</div>
                                <div class="card-body">
                                    <p>${material.description || 'No description available.'}</p>
                                    ${material.video_details ? `
                                        <div class="d-flex justify-content-between text-muted">
                                            <small>Duration: ${formatDuration(material.video_details.duration)}</small>
                                            ${material.video_details.resolution ? `<small>Resolution: ${material.video_details.resolution}</small>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 'document':
                        contentDisplay.innerHTML = `
                            <h3>${material.title}</h3>
                            <div class="card mb-3">
                                <div class="card-header">Document</div>
                                <div class="card-body">
                                    <p>${material.description || 'No description available.'}</p>
                                    <a href="${material.file_path}" class="btn btn-primary" target="_blank">
                                        <i class="bi bi-file-earmark-text"></i> View Document
                                    </a>
                                    <a href="${material.file_path}" class="btn btn-outline-primary" download>
                                        <i class="bi bi-download"></i> Download
                                    </a>
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 'image':
                        contentDisplay.innerHTML = `
                            <h3>${material.title}</h3>
                            <div class="text-center mb-3">
                                <img src="${material.file_path}" class="img-fluid rounded" alt="${material.title}" 
                                     style="max-height: 500px;">
                            </div>
                            <div class="card mb-3">
                                <div class="card-header">Description</div>
                                <div class="card-body">
                                    <p>${material.description || 'No description available.'}</p>
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 'audio':
                        contentDisplay.innerHTML = `
                            <h3>${material.title}</h3>
                            <div class="card mb-3">
                                <div class="card-header">Audio</div>
                                <div class="card-body">
                                    <audio controls class="w-100 mb-3">
                                        <source src="${material.file_path}" type="audio/mpeg">
                                        Your browser does not support the audio element.
                                    </audio>
                                    <p>${material.description || 'No description available.'}</p>
                                </div>
                            </div>
                        `;
                        break;
                        
                    default:
                        contentDisplay.innerHTML = `
                            <h3>${material.title}</h3>
                            <div class="card mb-3">
                                <div class="card-header">Content</div>
                                <div class="card-body">
                                    <p>${material.description || 'No description available.'}</p>
                                    <a href="${material.file_path}" class="btn btn-primary" target="_blank">
                                        <i class="bi bi-file-earmark"></i> Open File
                                    </a>
                                    <a href="${material.file_path}" class="btn btn-outline-primary" download>
                                        <i class="bi bi-download"></i> Download
                                    </a>
                                </div>
                            </div>
                        `;
                }
            });
        });

        // Add back button event listener
        document.getElementById('back-to-dashboard').addEventListener('click', () => {
            import('./student.js').then(module => module.renderStudentDashboard(state));
        });

        // Add CSS for the course content page
        const style = document.createElement('style');
        style.textContent = `
            .course-sidebar {
                max-height: calc(100vh - 100px);
                overflow-y: auto;
            }
            .section-header {
                cursor: pointer;
            }
            .section-header:hover {
                background-color: rgba(0,0,0,0.03);
            }
            .section-items {
                display: none;
            }
            .item-link {
                cursor: pointer;
            }
            .item-link:hover {
                background-color: rgba(0,0,0,0.03);
            }
            .item-link.active {
                background-color: rgba(13, 110, 253, 0.1);
                color: #0d6efd;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);

        // Open the first section by default
        if (structure.length > 0) {
            const firstSectionItems = document.getElementById('section-items-0');
            if (firstSectionItems) {
                firstSectionItems.style.display = 'block';
            }
        }

    } catch (error) {
        console.error('Error rendering course content:', error);
        content.innerHTML = `
            <div class="container mt-4">
                <div class="alert alert-danger">
                    <h4>Error Loading Course</h4>
                    <p>There was a problem loading the course content. Please try again later.</p>
                </div>
                <button class="btn btn-secondary" id="back-to-dashboard">Back to Dashboard</button>
            </div>
        `;
        document.getElementById('back-to-dashboard').addEventListener('click', () => {
            import('./student.js').then(module => module.renderStudentDashboard(state));
        });
    }
}

export default { renderCourseContentPage };
