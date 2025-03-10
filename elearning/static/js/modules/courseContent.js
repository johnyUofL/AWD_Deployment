// modules/courseContent.js
import { apiFetch } from './api.js';
import { showToast } from '../components/toast.js';

// Fetch course structure
async function fetchCourseStructure(courseId, state) {
    try {
        console.log('Fetching course structure for course ID:', courseId);
        
        const response = await apiFetch(`http://127.0.0.1:8000/api/core/course-structure/?course=${courseId}`, {}, state.token);
        console.log('Course structure API response:', response);
        
        if (response && response.length > 0 && response[0].structure_data) {
            const structureData = typeof response[0].structure_data === 'string' 
                ? JSON.parse(response[0].structure_data) 
                : response[0].structure_data;
            
            if (Array.isArray(structureData) && structureData.length > 0) {
                console.log('Using saved structure data:', structureData);
                return structureData;
            }
        }
        
        // Fallback to default structure if no saved structure or it's empty
        console.log('No valid saved structure found, creating default from materials');
        const materials = await apiFetch(`http://127.0.0.1:8000/api/core/materials/?course=${courseId}`, {}, state.token);
        console.log('Materials fetched for default structure:', materials);
        
        if (materials && materials.length > 0) {
            const videoMaterials = materials.filter(m => m.file_type === 'video');
            const documentMaterials = materials.filter(m => m.file_type === 'document');
            const imageMaterials = materials.filter(m => m.file_type === 'image');
            const audioMaterials = materials.filter(m => m.file_type === 'audio');
            const otherMaterials = materials.filter(m => 
                !['video', 'document', 'image', 'audio'].includes(m.file_type));
            
            const defaultStructure = [];
            
            if (videoMaterials.length > 0) {
                defaultStructure.push({
                    title: "Videos",
                    items: videoMaterials.map(m => ({ id: m.id.toString(), type: 'video' }))
                });
            }
            
            if (documentMaterials.length > 0) {
                defaultStructure.push({
                    title: "Documents",
                    items: documentMaterials.map(m => ({ id: m.id.toString(), type: 'document' }))
                });
            }
            
            if (imageMaterials.length > 0) {
                defaultStructure.push({
                    title: "Images",
                    items: imageMaterials.map(m => ({ id: m.id.toString(), type: 'image' }))
                });
            }
            
            if (audioMaterials.length > 0) {
                defaultStructure.push({
                    title: "Audio",
                    items: audioMaterials.map(m => ({ id: m.id.toString(), type: 'audio' }))
                });
            }
            
            if (otherMaterials.length > 0) {
                defaultStructure.push({
                    title: "Other Materials",
                    items: otherMaterials.map(m => ({ id: m.id.toString(), type: m.file_type }))
                });
            }
            
            console.log('Created default structure:', defaultStructure);
            return defaultStructure;
        }
        
        console.log('No materials found, returning empty structure');
        return [];
    } catch (error) {
        console.error('Error fetching course structure:', error);
        showToast('Failed to load course structure', 'danger');
        return [];
    }
}

// Fetch material details by ID
async function fetchMaterialDetails(materialId, materialType, state) {
    try {
        let endpoint;
        if (materialType === 'assignment') {
            endpoint = `http://127.0.0.1:8000/api/core/assignments/${materialId}/`;
        } else {
            endpoint = `http://127.0.0.1:8000/api/core/materials/${materialId}/`;
        }
        
        const material = await apiFetch(endpoint, {}, state.token);
        console.log(`Material details for ID ${materialId}:`, material);
        return material;
    } catch (error) {
        console.error(`Error fetching ${materialType} ${materialId}:`, error);
        // Return a placeholder object instead of throwing an error
        return {
            id: materialId,
            title: "Content Not Found",
            description: `The ${materialType} you're trying to access is no longer available.`,
            file_path: "",
            file_type: materialType,
            is_missing: true // Flag to identify missing content
        };
    }
}

// Format duration 
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
        console.log('Course details:', course);
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
                import('./courses.js').then(module => {
                    module.fetchCourses(state);
                }).catch(error => {
                    console.error('Error importing courses module:', error);
                    document.getElementById('content').innerHTML = `
                        <div class="container mt-4">
                            <div class="alert alert-danger">
                                <h4>Navigation Error</h4>
                                <p>Unable to return to dashboard. Please try refreshing the page.</p>
                            </div>
                        </div>
                    `;
                });
            });
            return;
        }

        // Fetch all materials in parallel
        const materialPromises = structure.flatMap(section => 
            section.items.map(item => fetchMaterialDetails(item.id, item.type, state))
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
                                                if (!material) {
                                                    console.warn(`Material not found for ID: ${item.id}`);
                                                    return '';
                                                }
                                                
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
                document.querySelectorAll('.item-link').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const sectionIndex = item.getAttribute('data-section');
                const itemIndex = item.getAttribute('data-item');
                const section = structure[sectionIndex];
                const itemData = section.items[itemIndex];
                const material = materialMap.get(parseInt(itemData.id));
                
                if (!material) {
                    showToast('Material not found', 'danger');
                    return;
                }
                
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
                    case 'assignment':
                        contentDisplay.innerHTML = `
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0">Assignment: ${material.title}</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <h6>Description:</h6>
                                        <p>${material.description}</p>
                                    </div>
                                    <div class="mb-3">
                                        <h6>Due Date:</h6>
                                        <p>${new Date(material.due_date).toLocaleString()}</p>
                                    </div>
                                    <div class="mb-3">
                                        <h6>Points:</h6>
                                        <p>${material.total_points}</p>
                                    </div>
                                    ${material.file_path ? `
                                        <div class="mb-3">
                                            <h6>Assignment File:</h6>
                                            <a href="${material.file_path}" class="btn btn-outline-primary" target="_blank">
                                                <i class="bi bi-download"></i> Download Assignment
                                            </a>
                                        </div>
                                    ` : ''}
                                    <div class="mt-4">
                                        <button class="btn btn-success submit-assignment-btn" data-id="${material.id}">
                                            <i class="bi bi-upload"></i> Submit Assignment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // Add event listener for submit button
                        contentDisplay.querySelector('.submit-assignment-btn').addEventListener('click', () => {
                            showAssignmentSubmissionModal(material.id, state);
                        });
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
            import('./courses.js').then(module => {
                module.fetchCourses(state);
            }).catch(error => {
                console.error('Error importing courses module:', error);
                document.getElementById('content').innerHTML = `
                    <div class="container mt-4">
                        <div class="alert alert-danger">
                            <h4>Navigation Error</h4>
                            <p>Unable to return to dashboard. Please try refreshing the page.</p>
                        </div>
                    </div>
                `;
            });
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
                firstSectionItems.previousElementSibling.querySelector('i').classList.replace('bi-chevron-down', 'bi-chevron-up');
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
            import('./courses.js').then(module => {
                module.fetchCourses(state);
            }).catch(error => {
                console.error('Error importing courses module:', error);
                document.getElementById('content').innerHTML = `
                    <div class="container mt-4">
                        <div class="alert alert-danger">
                            <h4>Navigation Error</h4>
                            <p>Unable to return to dashboard. Please try refreshing the page.</p>
                        </div>
                    </div>
                `;
            });
        });
    }
}

function showAssignmentSubmissionModal(assignmentId, state) {
    // First, check if the student has already submitted this assignment
    apiFetch(`http://127.0.0.1:8000/api/core/submissions/?assignment=${assignmentId}`, {}, state.token)
        .then(submissions => {
            const userSubmission = submissions.find(s => s.student_id === parseInt(state.userId));
            
            // Create modal element
            const modalElement = document.createElement('div');
            modalElement.className = 'modal fade';
            modalElement.id = 'assignmentSubmissionModal';
            modalElement.tabIndex = '-1';
            modalElement.setAttribute('aria-labelledby', 'assignmentSubmissionModalLabel');
            modalElement.setAttribute('aria-hidden', 'true');
            
            if (userSubmission) {
                // Student has already submitted
                modalElement.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="assignmentSubmissionModalLabel">Assignment Submission</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-success">
                                    <h5>Your Submission</h5>
                                    <p>${userSubmission.content || 'No text content provided.'}</p>
                                    ${userSubmission.file_path ? `
                                        <p><a href="${userSubmission.file_path}" target="_blank" class="btn btn-sm btn-outline-primary">
                                            <i class="bi bi-file-earmark"></i> View Submitted File
                                        </a></p>
                                    ` : ''}
                                    <p class="mb-0"><small>Submitted on: ${new Date(userSubmission.submitted_at).toLocaleString()}</small></p>
                                </div>
                                ${userSubmission.grade ? `
                                    <div class="alert alert-${userSubmission.grade >= 60 ? 'success' : 'warning'}">
                                        <h5>Grade</h5>
                                        <p><strong>${userSubmission.grade} / 100</strong></p>
                                        ${userSubmission.feedback ? `<p><strong>Feedback:</strong> ${userSubmission.feedback}</p>` : ''}
                                    </div>
                                ` : '<div class="alert alert-info">Your submission is waiting to be graded.</div>'}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Student has not submitted yet
                modalElement.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="assignmentSubmissionModalLabel">Submit Assignment</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="assignment-submission-form">
                                    <div class="mb-3">
                                        <label for="submission-file" class="form-label">Upload your assignment file</label>
                                        <input class="form-control" type="file" id="submission-file" required>
                                        <div class="form-text">Accepted file types: PDF, DOC, DOCX, ZIP, etc.</div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="submission-comments" class="form-label">Comments (optional)</label>
                                        <textarea class="form-control" id="submission-comments" rows="3" placeholder="Add any comments about your submission here..."></textarea>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="submit-assignment-btn-modal">
                                    <i class="bi bi-upload"></i> Submit
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            document.body.appendChild(modalElement);
            
            // Initialize the Bootstrap modal
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            
            // Add event listener for submit button if this is a new submission
            if (!userSubmission) {
                document.getElementById('submit-assignment-btn-modal').addEventListener('click', async () => {
                    const fileInput = document.getElementById('submission-file');
                    const comments = document.getElementById('submission-comments').value;
                    
                    if (!fileInput.files || fileInput.files.length === 0) {
                        showToast('Please select a file to upload', 'warning');
                        return;
                    }
                    
                    const file = fileInput.files[0];
                    const formData = new FormData();
                    formData.append('file_path', file);
                    formData.append('assignment', assignmentId);
                    formData.append('comments', comments || '');  // Make sure comments are included
                    
                    try {
                        // Show loading indicator
                        document.getElementById('submit-assignment-btn-modal').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...';
                        document.getElementById('submit-assignment-btn-modal').disabled = true;
                        
                        // Log the form data for debugging
                        console.log('Submitting assignment with data:', {
                            assignmentId,
                            comments: comments || '',
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type
                        });
                        
                        // Submit the assignment
                        const response = await fetch('http://127.0.0.1:8000/api/core/submissions/', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${state.token}`
                            },
                            body: formData
                        });
                        
                        if (!response.ok) {
                            // Try to get detailed error information
                            let errorText = '';
                            try {
                                const errorData = await response.json();
                                console.error('Server error details:', errorData);
                                errorText = JSON.stringify(errorData);
                            } catch (e) {
                                errorText = await response.text();
                                console.error('Server error response:', errorText);
                            }
                            
                            throw new Error(`Submission failed: ${response.status} - ${errorText}`);
                        }
                        
                        const result = await response.json();
                        console.log('Submission successful:', result);
                        
                        // Close the modal
                        modal.hide();
                        
                        // Show success message
                        showToast('Assignment submitted successfully!', 'success');
                        
                        // Remove the modal from DOM after hiding
                        modalElement.addEventListener('hidden.bs.modal', function () {
                            modalElement.remove();
                        });
                        
                        // Refresh the page to show updated submission status
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                        
                    } catch (error) {
                        console.error('Error submitting assignment:', error);
                        showToast('Failed to submit assignment: ' + error.message, 'danger');
                        
                        // Reset button
                        document.getElementById('submit-assignment-btn-modal').innerHTML = '<i class="bi bi-upload"></i> Submit';
                        document.getElementById('submit-assignment-btn-modal').disabled = false;
                    }
                });
            }
            
            // Remove the modal from DOM when it's closed
            modalElement.addEventListener('hidden.bs.modal', function () {
                modalElement.remove();
            });
        })
        .catch(error => {
            console.error('Error checking submission status:', error);
            showToast('Failed to check submission status: ' + error.message, 'danger');
        });
}

function showGradingModal(submissionId, studentName, totalPoints, state) {
    const modalHtml = `
        <div class="modal fade" id="gradingModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Grade Submission - ${studentName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="grading-form">
                            <div class="mb-3">
                                <label for="grade" class="form-label">Grade (out of ${totalPoints})</label>
                                <input type="number" class="form-control" id="grade" min="0" max="${totalPoints}" step="0.1" required>
                                <small class="form-text text-muted">Enter a score between 0 and ${totalPoints}</small>
                            </div>
                            <div class="mb-3">
                                <label for="feedback" class="form-label">Feedback (optional)</label>
                                <textarea class="form-control" id="feedback" rows="3" placeholder="Provide feedback to the student..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="submit-grade-btn">Submit Grade</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const gradingModal = document.getElementById('gradingModal');
    const modal = new bootstrap.Modal(gradingModal);
    modal.show();
    
    // Add event listener for submit button
    document.getElementById('submit-grade-btn').addEventListener('click', async () => {
        const grade = document.getElementById('grade').value;
        const feedback = document.getElementById('feedback').value;
        
        if (!grade) {
            showToast('Please enter a grade', 'warning');
            return;
        }
        
        const gradeValue = parseFloat(grade);
        if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > totalPoints) {
            showToast(`Grade must be between 0 and ${totalPoints}`, 'warning');
            return;
        }
        
        try {
            // Disable button and show loading state
            const submitBtn = document.getElementById('submit-grade-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
            
            // Submit the grade
            await apiFetch(`http://127.0.0.1:8000/api/core/submissions/${submissionId}/grade/`, {
                method: 'POST',
                body: JSON.stringify({
                    score: gradeValue,
                    feedback: feedback
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }, state.token);
            
            showToast('Grade submitted successfully!', 'success');
            modal.hide();
            
            // Refresh the submissions view
            const assignmentId = await getAssignmentIdFromSubmission(submissionId, state);
            if (assignmentId) {
                viewAssignmentSubmissions(assignmentId, state);
            } else {
                // Fallback to page reload if we can't get the assignment ID
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('Error submitting grade:', error);
            showToast('Failed to submit grade: ' + error.message, 'danger');
            
            // Reset button state
            const submitBtn = document.getElementById('submit-grade-btn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Grade';
        }
    });
    
    // Cleanup when modal is hidden
    gradingModal.addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Helper function to get assignment ID from submission ID
async function getAssignmentIdFromSubmission(submissionId, state) {
    try {
        const submission = await apiFetch(`http://127.0.0.1:8000/api/core/submissions/${submissionId}/`, {}, state.token);
        return submission.assignment;
    } catch (error) {
        console.error('Error fetching submission details:', error);
        return null;
    }
}

export default { renderCourseContentPage };