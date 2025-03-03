import { apiFetch } from '../utils/api.js';
import { showToast } from '../components/toast.js';

// Fetch course structure
async function fetchCourseStructure(courseId, state) {
    try {
        const response = await apiFetch(`/api/core/course-structure/?course=${courseId}`, {}, state.token);
        if (response && response.length > 0) {
            return response[0].structure_data; // Return sections array
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
        const material = await apiFetch(`/api/core/materials/${materialId}/`, {}, state.token);
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
        const course = await apiFetch(`/api/core/courses/${courseId}/`, {}, state.token);
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
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h2>${course.title}</h2>
                                <span class="badge bg-primary">${course.category || 'Course'}</span>
                            </div>
                            <div class="card-body" id="content-display">
                                <div class="text-center p-5">
                                    <h4>Welcome to ${course.title}</h4>
                                    <p>${course.description || 'Start learning by selecting content from the sidebar.'}</p>
                                    <i class="bi bi-arrow-left-circle fs-1 text-primary"></i>
                                    <p class="mt-3">Select an item from the sidebar to begin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for section headers (expand/collapse)
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const sectionIndex = header.dataset.section;
                const itemsContainer = document.getElementById(`section-items-${sectionIndex}`);
                const icon = header.querySelector('i');
                
                if (itemsContainer.style.display === 'none') {
                    itemsContainer.style.display = 'block';
                    icon.classList.replace('bi-chevron-right', 'bi-chevron-down');
                } else {
                    itemsContainer.style.display = 'none';
                    icon.classList.replace('bi-chevron-down', 'bi-chevron-right');
                }
            });
        });

        // Add event listeners for item clicks
        document.querySelectorAll('.item-link').forEach(item => {
            item.addEventListener('click', () => {
                const sectionIndex = parseInt(item.dataset.section);
                const itemIndex = parseInt(item.dataset.item);
                const section = structure[sectionIndex];
                const itemData = section.items[itemIndex];
                const material = materialMap.get(parseInt(itemData.id));
                
                if (!material) {
                    showToast('Could not load this content', 'danger');
                    return;
                }
                
                // Highlight the selected item
                document.querySelectorAll('.item-link').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                
                // Display the content
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
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted">
                                    <i class="bi bi-clock"></i> 
                                    ${material.video_details ? formatDuration(material.video_details.duration) : 'N/A'}
                                </span>
                                <span class="text-muted">
                                    Uploaded: ${new Date(material.upload_date).toLocaleDateString()}
                                </span>
                            </div>
                            <div class="card mb-3">
                                <div class="card-header">Description</div>
                                <div class="card-body">
                                    <p>${material.description || 'No description available.'}</p>
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