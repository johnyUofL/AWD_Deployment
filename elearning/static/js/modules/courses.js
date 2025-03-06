// modules/courses.js
import { apiFetch } from './api.js';
import { renderStudentProfile } from './ui.js';
import { showToast } from '../components/toast.js';
import { getCsrfToken } from './api.js';

export async function fetchCourses(state) {
    try {
        const courses = await apiFetch('http://127.0.0.1:8000/api/core/courses/', {}, state.token);
        const enrollments = await apiFetch('http://127.0.0.1:8000/api/core/enrollments/', {}, state.token);
        console.log('All enrollments:', enrollments);

        const userEnrollments = enrollments.filter(e => 
            e.student_detail.id === parseInt(state.userId) && 
            e.is_active === true
        );
        console.log('User active enrollments:', userEnrollments);

        const enrollmentMap = {};
        userEnrollments.forEach(enrollment => {
            enrollmentMap[enrollment.course_detail.id] = enrollment.id;
        });
        const enrolledCourseIds = userEnrollments.map(e => e.course_detail.id);

        // Store courses in state for filtering
        state.allCourses = courses;
        state.enrolledCourseIds = enrolledCourseIds;
        state.enrollmentMap = enrollmentMap;
        
        // Default view is all courses list
        renderCourseList(courses, enrolledCourseIds, enrollmentMap, false, state);
    } catch (error) {
        console.error('Error fetching courses:', error);
        document.getElementById('content').innerHTML = `<div class="alert alert-danger">Error loading courses: ${error.message}</div>`;
    }
}

export function renderCourseList(courses, enrolledCourseIds, enrollmentMap, enrolledOnly = false, state, searchTerm = '') {
    const content = document.getElementById('content');
    
    // Filter courses based on seach content
    let filteredCourses = courses;
    
    // Filter by enrollment when enrolled only is selected
    if (enrolledOnly) {
        filteredCourses = courses.filter(course => enrolledCourseIds.includes(course.id));
    }
    
    // Create the results counter HTML
    const resultsCounterHtml = `<div id="results-counter" class="filtered-results mb-3" style="display: none;"></div>`;

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Courses</h1>
            <div class="d-flex">
                <div class="input-group me-2" style="width: 300px;">
                    <input type="text" id="course-search" class="form-control" placeholder="Search courses..." value="${searchTerm}">
                    <button class="btn btn-outline-secondary" type="button" id="search-button">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
                <div class="btn-group" role="group">
                    <button type="button" class="btn ${!enrolledOnly ? 'btn-primary' : 'btn-outline-primary'}" id="all-courses-btn">All Courses</button>
                    <button type="button" class="btn ${enrolledOnly ? 'btn-primary' : 'btn-outline-primary'}" id="enrolled-courses-btn">Enrolled</button>
                </div>
            </div>
        </div>
        
        ${resultsCounterHtml}
        
        ${filteredCourses.length === 0 ? 
            `<div class="alert alert-info">No courses match your search criteria.</div>` : 
            `<div class="row">
                ${filteredCourses.map(course => `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 course-card">
                            ${course.cover_image_path ? `<img src="${course.cover_image_path}" class="card-img-top" alt="${course.title}" style="max-height: 200px; object-fit: cover;">` : `<img src="https://via.placeholder.com/200x200?text=No+Image" class="card-img-top" alt="No Image" style="max-height: 200px; object-fit: cover;">`}
                            <div class="card-body">
                                <h5 class="card-title">${course.title}</h5>
                                <p class="card-text">Taught by ${course.teacher.username}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    ${enrolledCourseIds.includes(course.id) ? 
                                        `<span class="badge bg-success">Enrolled</span>
                                         <div>
                                            <button class="btn btn-primary btn-sm me-1 profile-btn" data-user-id="${course.teacher.id}">View Teacher</button>
                                            <button class="btn btn-primary btn-sm me-1" data-course-id="${course.id}">Open</button>
                                            <button class="btn btn-outline-primary btn-sm me-1 chat-btn" data-user-id="${course.teacher.id}" data-username="${course.teacher.username}" title="Chat with teacher">
                                                <i class="bi bi-chat-dots"></i>
                                            </button>
                                            <button class="btn btn-danger btn-sm unenroll-btn" data-enrollment-id="${enrollmentMap[course.id]}">Unenroll</button>
                                         </div>` : 
                                        `<button class="btn btn-primary btn-sm me-1 profile-btn" data-user-id="${course.teacher.id}">View Teacher</button>
                                        <button class="btn btn-primary btn-sm enroll-btn" data-course-id="${course.id}">Enroll</button>`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`
        }
    `;

    // Add event listeners for the buttons
    document.querySelectorAll('[data-course-id]').forEach(button => {
        if (!button.classList.contains('enroll-btn')) {
            button.addEventListener('click', () => openCourse(button.getAttribute('data-course-id'), state));
        }
    });
    
    document.querySelectorAll('.enroll-btn').forEach(button => {
        button.addEventListener('click', () => enroll(button.getAttribute('data-course-id'), state));
    });
    
    document.querySelectorAll('.unenroll-btn').forEach(button => {
        button.addEventListener('click', () => unenroll(button.getAttribute('data-enrollment-id'), state));
    });
    
    document.getElementById('all-courses-btn').addEventListener('click', () => {
        renderCourseList(courses, enrolledCourseIds, enrollmentMap, false, state);
    });
    
    document.getElementById('enrolled-courses-btn').addEventListener('click', () => {
        renderCourseList(courses, enrolledCourseIds, enrollmentMap, true, state);
    });
    
    document.getElementById('search-button').addEventListener('click', () => {
        const searchTerm = document.getElementById('course-search').value.trim();
        renderCourseList(courses, enrolledCourseIds, enrollmentMap, enrolledOnly, state, searchTerm);
    });
    
    document.getElementById('course-search').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = e.target.value.trim();
            renderCourseList(courses, enrolledCourseIds, enrollmentMap, enrolledOnly, state, searchTerm);
        }
    });
    
    document.querySelectorAll('.profile-btn').forEach(button => {
        button.addEventListener('click', () => viewProfile(button.getAttribute('data-user-id'), state));
    });
    
    // Add chat button event listeners
    document.querySelectorAll('.chat-btn').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-user-id');
            const username = button.getAttribute('data-username');
            startChat(userId, username, state);
        });
    });

    // filtering if search term is provided
    if (searchTerm) {
        filterCourseCards(searchTerm);
    }
}

// function for DOM-based filtering
export function filterCourseCards(searchTerm) {
    const term = searchTerm.toLowerCase();
    const courseCards = document.querySelectorAll('.course-card');
    let visibleCount = 0;
    
    courseCards.forEach(card => {
        const cardContainer = card.closest('.col-md-4');
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const teacher = card.querySelector('.card-text').textContent.toLowerCase();
        
        if (title.includes(term) || teacher.includes(term)) {
            cardContainer.style.display = '';
            visibleCount++;
        } else {
            cardContainer.style.display = 'none';
        }
    });
    
    // Update the counter
    const resultsCounter = document.getElementById('results-counter');
    if (resultsCounter) {
        if (term) {
            resultsCounter.textContent = `Showing ${visibleCount} of ${courseCards.length} courses`;
            resultsCounter.style.display = 'block';
        } else {
            resultsCounter.style.display = 'none';
        }
    }
}

export async function enroll(courseId, state) {
    const studentId = parseInt(state.userId);
    console.log('Attempting to enroll:', { courseId, studentId });

    try {
        const enrollments = await apiFetch('http://127.0.0.1:8000/api/core/enrollments/', {}, state.token);
        console.log('Existing enrollments:', JSON.stringify(enrollments));
        const existingEnrollment = enrollments.find(e => 
            e.student_detail.id === studentId && 
            e.course_detail.id === parseInt(courseId) &&
            e.is_active === true
        );
        console.log('Already actively enrolled in this course:', existingEnrollment);

        if (existingEnrollment) {
            console.log('Already enrolled in this course');
            fetchCourses(state);
            return;
        }

        const data = await apiFetch('http://127.0.0.1:8000/api/core/enrollments/', {
            method: 'POST',
            body: JSON.stringify({ course: parseInt(courseId), student: studentId })
        }, state.token);
        console.log('Enrollment successful:', data);
        
        // Show success toast
        showToast('Thank you for enrolling in this course!', 'success');
        
        fetchCourses(state);
    } catch (error) {
        console.error('Enroll error:', error);
        showToast('Failed to enroll: ' + error.message, 'danger');
    }
}

export async function unenroll(enrollmentId, state) {
    if (!confirm('Are you sure you want to unenroll from this course?')) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/core/enrollments/${enrollmentId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'X-CSRFToken': getCsrfToken()
            }
        });
        console.log('Unenroll response status:', response.status);
        if (!response.ok && response.status !== 404) {
            throw new Error('Unenrollment failed: ' + response.status);
        }
        console.log(response.status === 404 ? 'Enrollment already deleted' : 'Successfully unenrolled');
        
        // Show danger toast
        showToast('Sorry to see you leave this course.', 'danger');
        
        fetchCourses(state);
    } catch (error) {
        console.error('Unenroll error:', error);
        showToast('Failed to unenroll: ' + error.message, 'danger');
        fetchCourses(state);
    }
}

export function openCourse(courseId, state) {
    console.log('Opening course:', courseId);
    import('../modules/courseContent.js').then(module => {
        module.renderCourseContentPage(courseId, state);
    }).catch(error => {
        console.error('Error importing courseContent.js:', error);
        alert('Could not load course content. Please try again later.');
    });
}

export async function viewProfile(userId, state) {
    try {
        const user = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${userId}/`, {}, state.token);
        const statusUpdates = await apiFetch(`http://127.0.0.1:8000/userauths/api/status-updates/?user=${userId}`, {}, state.token);
        renderStudentProfile(user, statusUpdates);
    } catch (error) {
        console.error('Error fetching profile or status updates:', error);
        document.getElementById('content').innerHTML = `<div class="alert alert-danger">Error loading profile: ${error.message}</div>`;
    }
}

export async function startChat(userId, username, state) {
    try {
        console.log(`Attempting to connect to WebSocket with target user ID: ${userId}`);
        
        // Check if state is defined
        if (!state) {
            console.error('State is undefined');
            throw new Error('Application state is not available');
        }
        
        // Create a user object from the state properties if state.user doesn't exist
        if (!state.user) {
            console.log('Creating user object from state properties');
            
            // Get the current user information using the userId from state
            try {
                const currentUser = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${state.userId}/`, {}, state.token);
                state.user = currentUser;
                console.log('Current user fetched:', currentUser);
            } catch (userError) {
                // If we can't fetch the user, create a minimal user object from state
                console.log('Using minimal user object from state properties');
                state.user = {
                    id: state.userId,
                    username: state.username || 'user_' + state.userId,
                    first_name: state.firstName || '',
                    last_name: state.lastName || ''
                };
                console.log('Created user object:', state.user);
            }
        }
        
        // Get the target user's information
        const targetUser = await apiFetch(`http://127.0.0.1:8000/userauths/api/users/${userId}/`, {}, state.token);
        console.log('Target user:', targetUser);
        
        // First, check if a private chat room already exists between these users
        console.log(`Loading chat history between users ${state.user.id} and ${userId}`);
        const existingRooms = await apiFetch(`http://127.0.0.1:8000/api/addon/chat-rooms/`, {}, state.token);
        
        console.log(`Found ${existingRooms.length} chat rooms:`, existingRooms);
        
        // Look for a private chat room with both users
        let chatRoom = null;
        if (existingRooms.length > 0) {
            // Display the first room structure for debugging
            if (existingRooms[0]) {
                console.log("First room structure:", JSON.stringify(existingRooms[0], null, 2));
            }
            
            // Find a room that is private and has both users as participants
            for (const room of existingRooms) {
                if (room.is_private) {
                    // Check if both users are participants
                    const participants = await apiFetch(`http://127.0.0.1:8000/api/addon/participants/?room=${room.id}`, {}, state.token);
                    const participantIds = participants.map(p => p.user.id);
                    
                    if (participantIds.includes(parseInt(state.user.id)) && participantIds.includes(parseInt(userId))) {
                        chatRoom = room;
                        console.log(`Found existing chat room: ${room.id}`);
                        break;
                    }
                }
            }
        }
        
        // If no existing room, create a new one
        if (!chatRoom) {
            console.log("Creating new chat room");
            
            // Create a proper chat room name based on both users
            const currentUserName = state.user.username;
            const targetUserName = targetUser.username;
            const chatRoomName = `Private Chat: ${currentUserName}-${targetUserName}`;
            
            console.log(`Creating chat room with name: ${chatRoomName}`);
            
            // Create a new chat room
            chatRoom = await apiFetch('http://127.0.0.1:8000/api/addon/chat-rooms/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: chatRoomName,
                    description: '',
                    course_id: null,
                    is_private: true
                })
            }, state.token);
            
            console.log("Chat room created successfully:", chatRoom);
            
            // Add current user as participant
            await apiFetch('http://127.0.0.1:8000/api/addon/participants/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    room_id: chatRoom.id,
                    user_id: state.user.id
                })
            }, state.token);
            
            console.log(`Added current user (${state.user.id}) as participant`);
            
            // Add target user as participant
            await apiFetch('http://127.0.0.1:8000/api/addon/participants/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    room_id: chatRoom.id,
                    user_id: userId
                })
            }, state.token);
            
            console.log(`Added target user (${userId}) as participant`);
        }
        
        // Open the chat interface
        openChatInterface(chatRoom.id, targetUser, state);
        
    } catch (error) {
        console.error('Error starting chat:', error);
        showToast('Failed to start chat: ' + error.message, 'danger');
    }
}

// Function to open the chat interface
function openChatInterface(roomId, targetUser, state) {
    try {
        console.log(`Opening chat interface for room: ${roomId} with user:`, targetUser);
        
        // Check if a chat window already exists for this room
        let chatWindow = document.getElementById(`chat-window-${roomId}`);
        
        if (chatWindow) {
            console.log("Chat window already exists, making it visible");
            chatWindow.style.display = 'flex';
            
            // If minimized, restore it
            const chatBody = chatWindow.querySelector('.chat-messages');
            const chatFooter = chatWindow.querySelector('.chat-input');
            if (chatBody.style.display === 'none') {
                chatBody.style.display = 'block';
                chatFooter.style.display = 'block';
            }
            
            // Focus the input field
            const inputField = chatWindow.querySelector('input');
            if (inputField) inputField.focus();
            
            return;
        }
        
        console.log("Creating new chat window");
        
        // Create chat window with the same styling as teacher.js
        const chatWindowHtml = `
            <div id="chat-window-${roomId}" class="chat-window" style="position: fixed; bottom: 20px; right: 20px; width: 350px; z-index: 1050; background: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 500px;">
                <div class="chat-header draggable-handle" style="padding: 10px; background: #f8f9fa; border-radius: 8px 8px 0 0; cursor: move; display: flex; justify-content: space-between; align-items: center;">
                    <h6 class="m-0">Chat with ${targetUser.first_name} ${targetUser.last_name}</h6>
                    <div>
                        <button class="btn btn-sm btn-link minimize-chat-btn" style="padding: 0 5px;">
                            <i class="bi bi-dash"></i>
                        </button>
                        <button class="btn btn-sm btn-link close-chat-btn" style="padding: 0 5px;">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>
                <div id="chat-messages-${roomId}" class="chat-messages" style="padding: 10px; overflow-y: auto; flex-grow: 1; height: 300px;">
                    <div id="chat-status-${roomId}" class="text-center text-muted">Loading messages...</div>
                </div>
                <div class="chat-input" style="padding: 10px; border-top: 1px solid #dee2e6;">
                    <div class="input-group">
                        <input type="text" id="chat-input-${roomId}" class="form-control" placeholder="Type your message...">
                        <button id="send-button-${roomId}" class="btn btn-primary">Send</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatWindowHtml);
        chatWindow = document.getElementById(`chat-window-${roomId}`);
        
        // Make chat window draggable
        makeChatWindowDraggable(chatWindow);
        
        // Add event listeners
        chatWindow.querySelector('.close-chat-btn').addEventListener('click', () => {
            // Clear the message polling interval when closing the chat
            if (state.messagePollingIntervals && state.messagePollingIntervals[roomId]) {
                clearInterval(state.messagePollingIntervals[roomId]);
                delete state.messagePollingIntervals[roomId];
            }
            chatWindow.remove();
        });
        
        chatWindow.querySelector('.minimize-chat-btn').addEventListener('click', () => {
            const chatBody = chatWindow.querySelector('.chat-messages');
            const chatFooter = chatWindow.querySelector('.chat-input');
            
            if (chatBody.style.display === 'none') {
                chatBody.style.display = 'block';
                chatFooter.style.display = 'block';
            } else {
                chatBody.style.display = 'none';
                chatFooter.style.display = 'none';
            }
        });
        
        const sendButton = chatWindow.querySelector(`#send-button-${roomId}`);
        const inputField = chatWindow.querySelector(`#chat-input-${roomId}`);
        
        sendButton.addEventListener('click', () => {
            const content = inputField.value.trim();
            if (content) {
                sendChatMessage(roomId, content, state, `chat-messages-${roomId}`);
                inputField.value = '';
            }
        });
        
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const content = inputField.value.trim();
                if (content) {
                    sendChatMessage(roomId, content, state, `chat-messages-${roomId}`);
                    inputField.value = '';
                }
            }
        });
        
        // Load existing messages
        loadChatMessages(roomId, state);
        
        // Set up polling for new messages
        setupMessagePolling(roomId, state);
        
        // Focus the input field
        inputField.focus();
        
    } catch (error) {
        console.error('Error opening chat interface:', error);
        showToast('Failed to open chat interface: ' + error.message, 'danger');
    }
}

// Make chat window draggable
function makeChatWindowDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.chat-header');
    
    if (header) {
        header.onmousedown = dragMouseDown;
    } else {
        element.onmousedown = dragMouseDown;
    }
    
    function dragMouseDown(e) {
        e.preventDefault();
        // Get mouse position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call function whenever cursor moves
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e.preventDefault();
        // Calculate new position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Load chat messages
async function loadChatMessages(roomId, state) {
    try {
        console.log(`Loading messages for room: ${roomId}`);
        
        const messagesContainer = document.getElementById(`chat-messages-${roomId}`);
        const statusElement = document.getElementById(`chat-status-${roomId}`);
        
        if (!messagesContainer || !statusElement) {
            console.error("Message container or status element not found");
            return;
        }
        
        statusElement.textContent = 'Loading messages...';
        
        // Fetch messages for this room
        const messages = await apiFetch(`http://127.0.0.1:8000/api/addon/messages/?room=${roomId}`, {}, state.token);
        console.log(`Loaded ${messages.length} messages`);
        
        if (messages.length === 0) {
            statusElement.textContent = 'No messages yet. Start the conversation!';
        } else {
            statusElement.textContent = '';
            
            // Display messages
            messages.forEach(message => {
                displayMessage(message, state.user.id, `chat-messages-${roomId}`);
            });
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Store the ID of the last message for polling
            if (!state.lastMessageIds) {
                state.lastMessageIds = {};
            }
            state.lastMessageIds[roomId] = Math.max(...messages.map(message => message.id));
        }
        
        // Try to mark messages as read - first try GET method
        try {
            await apiFetch(`http://127.0.0.1:8000/api/addon/messages/mark-read/?room=${roomId}`, {
                method: 'GET'
            }, state.token);
            console.log('Messages marked as read using GET method');
        } catch (markReadError) {
            // If GET fails, try PUT method
            try {
                await apiFetch(`http://127.0.0.1:8000/api/addon/messages/mark-read/?room=${roomId}`, {
                    method: 'PUT'
                }, state.token);
                console.log('Messages marked as read using PUT method');
            } catch (putError) {
                // If PUT fails, just log the error but don't fail the whole function
                console.warn('Could not mark messages as read:', putError);
            }
        }
        
    } catch (error) {
        console.error('Error loading chat messages:', error);
        const statusElement = document.getElementById(`chat-status-${roomId}`);
        if (statusElement) {
            statusElement.textContent = 'Failed to load messages. Please try again.';
        }
    }
}

// Display a message in the chat window
function displayMessage(message, currentUserId, messagesContainerId) {
    const chatMessagesContainer = document.getElementById(messagesContainerId);
    if (!chatMessagesContainer) {
        console.error(`Chat messages container ${messagesContainerId} not found`);
        return;
    }
    
    // Remove the status message if it exists
    const statusElement = document.getElementById(`chat-status-${messagesContainerId.split('-').pop()}`);
    if (statusElement && statusElement.parentNode === chatMessagesContainer) {
        chatMessagesContainer.removeChild(statusElement);
    }
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.style.marginBottom = '10px';
    messageElement.style.padding = '8px';
    messageElement.style.borderRadius = '8px';
    
    // Make sure we have the correct structure for the message
    const userId = message.user ? message.user.id : (message.user_id || 0);
    const isCurrentUser = userId == currentUserId;
    
    // Add sender class if the message is from the current user
    if (isCurrentUser) {
        messageElement.classList.add('sender');
        messageElement.style.backgroundColor = '#e3f2fd';
        messageElement.style.marginLeft = '20%';
    } else {
        messageElement.classList.add('receiver');
        messageElement.style.backgroundColor = '#f5f5f5';
        messageElement.style.marginRight = '20%';
    }
    
    // Format timestamp
    const timestamp = new Date(message.timestamp || message.sent_at).toLocaleTimeString();
    
    // Get the sender name
    const senderName = message.user ? 
        (message.user.first_name || message.user.username) : 
        'Unknown';
    
    messageElement.innerHTML = `
        <div class="message-content" style="word-break: break-word;">${message.content}</div>
        <div class="message-meta" style="font-size: 0.8rem; color: #6c757d; display: flex; justify-content: space-between; margin-top: 5px;">
            <span class="message-sender">${senderName}</span>
            <span class="message-time">${timestamp}</span>
        </div>
    `;
    
    chatMessagesContainer.appendChild(messageElement);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// Send a chat message
async function sendChatMessage(roomId, content, state, messagesContainerId) {
    try {
        console.log(`Sending message to room ${roomId}: ${content}`);
        
        // Send the message
        const message = await apiFetch(`http://127.0.0.1:8000/api/addon/messages/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                room_id: roomId,
                content: content
            })
        }, state.token);
        
        console.log("Message sent successfully:", message);
        
        // Display the message
        displayMessage(message, state.user.id, messagesContainerId);
        
        // Add a small delay to ensure the message is displayed before scrolling
        setTimeout(() => {
            const messagesContainer = document.getElementById(messagesContainerId);
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
        
    } catch (error) {
        console.error('Error sending message:', error);
        const messagesContainer = document.getElementById(messagesContainerId);
        const errorElement = document.createElement('div');
        errorElement.className = 'message-error';
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.textAlign = 'center';
        errorElement.style.margin = '5px 0';
        errorElement.textContent = 'Failed to send message. Please try again.';
        messagesContainer.appendChild(errorElement);
    }
}
// Function to set up polling for new messages
function setupMessagePolling(roomId, state) {
    // Initialize the messagePollingIntervals object if it doesn't exist
    if (!state.messagePollingIntervals) {
        state.messagePollingIntervals = {};
    }
    
    // Clear any existing interval for this room
    if (state.messagePollingIntervals[roomId]) {
        clearInterval(state.messagePollingIntervals[roomId]);
    }
    
    // Store the last message ID to check for new messages
    if (!state.lastMessageIds) {
        state.lastMessageIds = {};
    }
    
    // Set up polling interval (check for new messages every 3 seconds)
    state.messagePollingIntervals[roomId] = setInterval(() => {
        pollForNewMessages(roomId, state);
    }, 3000);
    
    console.log(`Set up message polling for room ${roomId}`);
}

// Function to poll for new messages
async function pollForNewMessages(roomId, state) {
    try {
        // Get the messages container
        const messagesContainer = document.getElementById(`chat-messages-${roomId}`);
        if (!messagesContainer) {
            // If the container doesn't exist, the chat window might be closed
            if (state.messagePollingIntervals && state.messagePollingIntervals[roomId]) {
                clearInterval(state.messagePollingIntervals[roomId]);
                delete state.messagePollingIntervals[roomId];
            }
            return;
        }
        
        // Fetch the latest messages
        const messages = await apiFetch(`http://127.0.0.1:8000/api/addon/messages/?room=${roomId}`, {}, state.token);
        
        // If there are no messages, do nothing
        if (messages.length === 0) return;
        
        // Get the last message ID we've seen
        const lastMessageId = state.lastMessageIds[roomId] || 0;
        
        // Find new messages (messages with IDs greater than the last one we've seen)
        const newMessages = messages.filter(message => message.id > lastMessageId);
        
        // If there are new messages, display them and update the last message ID
        if (newMessages.length > 0) {
            console.log(`Found ${newMessages.length} new messages for room ${roomId}`);
            
            // Display each new message
            newMessages.forEach(message => {
                // Only display messages from the other user (we already display our own messages when sending)
                if (message.user.id != state.user.id) {
                    displayMessage(message, state.user.id, `chat-messages-${roomId}`);
                }
            });
            
            // Update the last message ID
            state.lastMessageIds[roomId] = Math.max(...messages.map(message => message.id));
            
            // Scroll to the bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Play a notification sound for new messages
            if (newMessages.some(message => message.user.id != state.user.id)) {
                playNotificationSound();
            }
        }
    } catch (error) {
        console.error(`Error polling for new messages in room ${roomId}:`, error);
    }
}

// Function to play a notification sound
function playNotificationSound() {
    try {
        const audio = new Audio('/static/sounds/notification.mp3');
        audio.volume = 0.5; // Set volume to 50%
        audio.play().catch(error => {
            console.error('Error playing notification sound:', error);
        });
    } catch (error) {
        console.error('Error creating audio object:', error);
    }
}
