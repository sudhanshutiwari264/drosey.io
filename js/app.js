// DrowzAlert - Driver Drowsiness Detection Application

// Constants and configuration
const CONFIG = {
    // Drowsiness detection thresholds (default values)
    EAR_THRESHOLD: 0.2,         // Eye Aspect Ratio threshold for closed eyes
    HEAD_TILT_THRESHOLD: 20,    // Head tilt angle threshold in degrees
    DROWSY_TIME_THRESHOLD: 2.0, // Seconds of continuous drowsiness before alarm
    
    // Face mesh landmarks indices
    // Left eye landmarks
    LEFT_EYE_LANDMARKS: [
        33, 160, 158, 133, 153, 144  // Upper and lower landmarks for left eye
    ],
    // Right eye landmarks
    RIGHT_EYE_LANDMARKS: [
        362, 385, 387, 263, 373, 380  // Upper and lower landmarks for right eye
    ],
    // Face orientation landmarks
    FACE_OVAL_LANDMARKS: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288],
    
    // Default settings (for reset)
    DEFAULT_SETTINGS: {
        EAR_THRESHOLD: 0.2,
        HEAD_TILT_THRESHOLD: 20,
        DROWSY_TIME_THRESHOLD: 2.0
    }
};

// Application state
const state = {
    isRunning: false,
    isDrowsy: false,
    drowsyStartTime: null,
    alarmPlaying: false,
    faceMeshModel: null,
    camera: null,
    lastDrowsyEventTime: 0,
    
    // Session statistics
    sessionStartTime: 0,
    drowsyEvents: 0,
    totalDrowsyTime: 0,
    responseTimeSum: 0,
    soundEnabled: true,
    
    // Theme
    darkMode: localStorage.getItem('darkMode') === 'true',
    
    // Session timer
    sessionTimer: null
};

// DOM Elements
const elements = {
    video: document.getElementById('webcam'),
    canvas: document.getElementById('output-canvas'),
    startBtn: document.getElementById('start-btn'),
    stopBtn: document.getElementById('stop-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    statusBadge: document.getElementById('status-badge'),
    earValue: document.getElementById('ear-value'),
    headAngleValue: document.getElementById('head-angle-value'),
    drowsyLog: document.getElementById('drowsy-log'),
    loadingOverlay: document.getElementById('loading-overlay'),
    earProgress: document.getElementById('ear-progress'),
    headAngleProgress: document.getElementById('head-angle-progress'),
    
    // Theme toggle
    themeToggle: document.getElementById('theme-toggle'),
    soundToggle: document.getElementById('sound-toggle'),
    
    // Session statistics
    sessionTime: document.getElementById('session-time'),
    drowsyCount: document.getElementById('drowsy-count'),
    alertTime: document.getElementById('alert-time'),
    attentionScore: document.getElementById('attention-score'),
    logCount: document.getElementById('log-count'),
    
    // Settings modal elements
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    earThreshold: document.getElementById('ear-threshold'),
    earThresholdValue: document.getElementById('ear-threshold-value'),
    headTiltThreshold: document.getElementById('head-tilt-threshold'),
    headTiltThresholdValue: document.getElementById('head-tilt-threshold-value'),
    drowsyTimeThreshold: document.getElementById('drowsy-time-threshold'),
    drowsyTimeThresholdValue: document.getElementById('drowsy-time-threshold-value'),
    resetSettings: document.getElementById('reset-settings'),
    saveSettings: document.getElementById('save-settings')
};

// Canvas context
const ctx = elements.canvas.getContext('2d');

// Audio setup for alarm
let alarmSound;

// Toggle dark mode
function toggleDarkMode() {
    // Toggle dark mode state
    state.darkMode = !state.darkMode;
    
    // Apply dark mode to document
    if (state.darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', state.darkMode);
}

// Toggle sound
function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    
    // Update UI
    const soundOnIcon = elements.soundToggle.querySelector('.sound-on');
    const soundOffIcon = elements.soundToggle.querySelector('.sound-off');
    
    if (state.soundEnabled) {
        soundOnIcon.classList.remove('hidden');
        soundOffIcon.classList.add('hidden');
    } else {
        soundOnIcon.classList.add('hidden');
        soundOffIcon.classList.remove('hidden');
    }
    
    // Save preference to localStorage
    localStorage.setItem('soundEnabled', state.soundEnabled);
}

// Update session statistics
function updateSessionStats() {
    if (!state.isRunning) return;
    
    // Calculate session duration
    const sessionDuration = Math.floor((Date.now() - state.sessionStartTime) / 1000);
    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;
    elements.sessionTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update drowsy count
    elements.drowsyCount.textContent = state.drowsyEvents;
    
    // Update average response time (if any drowsy events)
    if (state.drowsyEvents > 0) {
        const avgResponseTime = (state.responseTimeSum / state.drowsyEvents).toFixed(1);
        elements.alertTime.textContent = `${avgResponseTime}s`;
    }
    
    // Calculate attention score (100 - percentage of time drowsy)
    let attentionScore = 100;
    if (sessionDuration > 0) {
        attentionScore = Math.max(0, Math.round(100 - (state.totalDrowsyTime / sessionDuration * 100)));
    }
    elements.attentionScore.textContent = attentionScore;
    
    // Update log count
    if (elements.logCount) {
        elements.logCount.textContent = state.drowsyEvents;
    }
}

// Initialize the application
async function initApp() {
    // Apply dark mode if saved
    if (state.darkMode) {
        document.documentElement.classList.add('dark');
    }
    
    // Set up event listeners
    elements.startBtn.addEventListener('click', startDetection);
    elements.stopBtn.addEventListener('click', stopDetection);
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    elements.closeSettings.addEventListener('click', closeSettingsModal);
    elements.saveSettings.addEventListener('click', saveSettings);
    elements.resetSettings.addEventListener('click', resetSettings);
    
    // Theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Sound toggle
    if (elements.soundToggle) {
        // Load sound preference
        state.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        
        // Update UI to match state
        const soundOnIcon = elements.soundToggle.querySelector('.sound-on');
        const soundOffIcon = elements.soundToggle.querySelector('.sound-off');
        
        if (state.soundEnabled) {
            soundOnIcon.classList.remove('hidden');
            soundOffIcon.classList.add('hidden');
        } else {
            soundOnIcon.classList.add('hidden');
            soundOffIcon.classList.remove('hidden');
        }
        
        elements.soundToggle.addEventListener('click', toggleSound);
    }
    
    // Future features modal
    const futureBtn = document.getElementById('future-features-btn');
    const footerFutureBtn = document.getElementById('footer-future-btn');
    const closeFutureBtn = document.getElementById('close-future-features');
    const futureModal = document.getElementById('future-features-modal');
    
    // Function to open future features modal
    const openFutureModal = () => {
        futureModal.classList.remove('hidden');
        setTimeout(() => {
            futureModal.classList.add('modal-visible');
        }, 10);
    };
    
    // Function to close future features modal
    const closeFutureModal = () => {
        futureModal.classList.remove('modal-visible');
        setTimeout(() => {
            futureModal.classList.add('hidden');
        }, 300);
    };
    
    if (futureBtn && closeFutureBtn && futureModal) {
        futureBtn.addEventListener('click', openFutureModal);
        closeFutureBtn.addEventListener('click', closeFutureModal);
        
        // Add event listener to footer button
        if (footerFutureBtn) {
            footerFutureBtn.addEventListener('click', openFutureModal);
        }
    }
    
    // Initialize settings sliders
    initSettingsSliders();
    
    // Initialize audio
    initAudio();
    
    // Initialize FaceMesh
    await initFaceMesh();
    
    // Adjust canvas size to match video
    window.addEventListener('resize', adjustCanvasSize);
    
    // Load saved settings if available
    loadSettings();
}

// Initialize settings sliders
function initSettingsSliders() {
    // Set initial values
    elements.earThreshold.value = CONFIG.EAR_THRESHOLD;
    elements.earThresholdValue.textContent = CONFIG.EAR_THRESHOLD.toFixed(2);
    
    elements.headTiltThreshold.value = CONFIG.HEAD_TILT_THRESHOLD;
    elements.headTiltThresholdValue.textContent = CONFIG.HEAD_TILT_THRESHOLD + '°';
    
    elements.drowsyTimeThreshold.value = CONFIG.DROWSY_TIME_THRESHOLD;
    elements.drowsyTimeThresholdValue.textContent = CONFIG.DROWSY_TIME_THRESHOLD.toFixed(1) + 's';
    
    // Add input event listeners
    elements.earThreshold.addEventListener('input', () => {
        const value = parseFloat(elements.earThreshold.value);
        elements.earThresholdValue.textContent = value.toFixed(2);
    });
    
    elements.headTiltThreshold.addEventListener('input', () => {
        const value = parseInt(elements.headTiltThreshold.value);
        elements.headTiltThresholdValue.textContent = value + '°';
    });
    
    elements.drowsyTimeThreshold.addEventListener('input', () => {
        const value = parseFloat(elements.drowsyTimeThreshold.value);
        elements.drowsyTimeThresholdValue.textContent = value.toFixed(1) + 's';
    });
}

// Open settings modal
function openSettingsModal() {
    // Show modal
    elements.settingsModal.classList.remove('hidden');
    
    // Add animation class after a small delay to trigger animation
    setTimeout(() => {
        elements.settingsModal.classList.add('modal-visible');
    }, 10);
}

// Close settings modal
function closeSettingsModal() {
    // Remove animation class
    elements.settingsModal.classList.remove('modal-visible');
    
    // Hide modal after animation completes
    setTimeout(() => {
        elements.settingsModal.classList.add('hidden');
    }, 300);
}

// Save settings
function saveSettings() {
    // Update configuration
    CONFIG.EAR_THRESHOLD = parseFloat(elements.earThreshold.value);
    CONFIG.HEAD_TILT_THRESHOLD = parseInt(elements.headTiltThreshold.value);
    CONFIG.DROWSY_TIME_THRESHOLD = parseFloat(elements.drowsyTimeThreshold.value);
    
    // Save to localStorage
    const settings = {
        EAR_THRESHOLD: CONFIG.EAR_THRESHOLD,
        HEAD_TILT_THRESHOLD: CONFIG.HEAD_TILT_THRESHOLD,
        DROWSY_TIME_THRESHOLD: CONFIG.DROWSY_TIME_THRESHOLD
    };
    
    localStorage.setItem('drowzalert-settings', JSON.stringify(settings));
    
    // Close modal
    closeSettingsModal();
}

// Reset settings to default
function resetSettings() {
    // Reset configuration
    CONFIG.EAR_THRESHOLD = CONFIG.DEFAULT_SETTINGS.EAR_THRESHOLD;
    CONFIG.HEAD_TILT_THRESHOLD = CONFIG.DEFAULT_SETTINGS.HEAD_TILT_THRESHOLD;
    CONFIG.DROWSY_TIME_THRESHOLD = CONFIG.DEFAULT_SETTINGS.DROWSY_TIME_THRESHOLD;
    
    // Update UI
    elements.earThreshold.value = CONFIG.EAR_THRESHOLD;
    elements.earThresholdValue.textContent = CONFIG.EAR_THRESHOLD.toFixed(2);
    
    elements.headTiltThreshold.value = CONFIG.HEAD_TILT_THRESHOLD;
    elements.headTiltThresholdValue.textContent = CONFIG.HEAD_TILT_THRESHOLD + '°';
    
    elements.drowsyTimeThreshold.value = CONFIG.DROWSY_TIME_THRESHOLD;
    elements.drowsyTimeThresholdValue.textContent = CONFIG.DROWSY_TIME_THRESHOLD.toFixed(1) + 's';
    
    // Remove from localStorage
    localStorage.removeItem('drowzalert-settings');
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('drowzalert-settings');
    
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            
            // Update configuration
            CONFIG.EAR_THRESHOLD = settings.EAR_THRESHOLD;
            CONFIG.HEAD_TILT_THRESHOLD = settings.HEAD_TILT_THRESHOLD;
            CONFIG.DROWSY_TIME_THRESHOLD = settings.DROWSY_TIME_THRESHOLD;
            
            // Update UI
            elements.earThreshold.value = CONFIG.EAR_THRESHOLD;
            elements.earThresholdValue.textContent = CONFIG.EAR_THRESHOLD.toFixed(2);
            
            elements.headTiltThreshold.value = CONFIG.HEAD_TILT_THRESHOLD;
            elements.headTiltThresholdValue.textContent = CONFIG.HEAD_TILT_THRESHOLD + '°';
            
            elements.drowsyTimeThreshold.value = CONFIG.DROWSY_TIME_THRESHOLD;
            elements.drowsyTimeThresholdValue.textContent = CONFIG.DROWSY_TIME_THRESHOLD.toFixed(1) + 's';
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
}

// Initialize the alarm sound using Tone.js
function initAudio() {
    // Create a synth and connect it to the main output (speakers)
    alarmSound = new Tone.Synth({
        oscillator: {
            type: 'square'
        },
        envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.5,
            release: 0.1
        }
    }).toDestination();
}

// Play alarm sound
function playAlarm() {
    if (!state.alarmPlaying) {
        state.alarmPlaying = true;
        
        // Play a repeating pattern
        const now = Tone.now();
        alarmSound.triggerAttackRelease("C5", "8n", now);
        alarmSound.triggerAttackRelease("E5", "8n", now + 0.25);
        alarmSound.triggerAttackRelease("G5", "8n", now + 0.5);
        alarmSound.triggerAttackRelease("C6", "8n", now + 0.75);
        
        // Schedule to repeat
        setTimeout(() => {
            if (state.isDrowsy) {
                state.alarmPlaying = false;
                playAlarm();
            } else {
                state.alarmPlaying = false;
            }
        }, 1000);
    }
}

// Stop alarm sound
function stopAlarm() {
    state.alarmPlaying = false;
}

// Initialize MediaPipe FaceMesh
async function initFaceMesh() {
    state.faceMeshModel = new FaceMesh({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
    });
    
    state.faceMeshModel.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    state.faceMeshModel.onResults(onFaceMeshResults);
}

// Start webcam and detection
async function startDetection() {
    try {
        // Show loading overlay
        elements.loadingOverlay.classList.remove('hidden');
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });
        
        elements.video.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise(resolve => {
            elements.video.onloadedmetadata = () => {
                resolve();
            };
        });
        
        // Adjust canvas size
        adjustCanvasSize();
        
        // Start camera
        state.camera = new Camera(elements.video, {
            onFrame: async () => {
                await state.faceMeshModel.send({ image: elements.video });
            },
            width: 640,
            height: 480
        });
        state.camera.start();
        
        // Update UI
        state.isRunning = true;
        elements.startBtn.classList.add('hidden');
        elements.stopBtn.classList.remove('hidden');
        
        // Clear log
        clearDrowsyLog();
        
        // Reset session statistics
        state.sessionStartTime = Date.now();
        state.drowsyEvents = 0;
        state.totalDrowsyTime = 0;
        state.responseTimeSum = 0;
        
        // Start session timer
        state.sessionTimer = setInterval(updateSessionStats, 1000);
        
        // Initialize session stats display
        updateSessionStats();
        
        // Hide loading overlay after a short delay
        setTimeout(() => {
            elements.loadingOverlay.classList.add('hidden');
        }, 1000);
        
        console.log('Detection started');
    } catch (error) {
        console.error('Error starting detection:', error);
        elements.loadingOverlay.classList.add('hidden');
        
        // Show error message with better styling
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed inset-0 flex items-center justify-center z-50';
        errorMessage.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <div class="flex items-center text-red-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <h3 class="text-xl font-bold dark:text-white">Camera Access Error</h3>
                </div>
                <p class="mb-4 dark:text-gray-300">Unable to access your camera. Please make sure you have granted camera permissions for this site.</p>
                <div class="flex justify-end">
                    <button class="btn btn-primary py-2 px-4 rounded-lg" onclick="this.parentNode.parentNode.parentNode.remove()">
                        OK
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(errorMessage);
    }
}

// Stop detection
function stopDetection() {
    if (state.camera) {
        state.camera.stop();
    }
    
    if (elements.video.srcObject) {
        elements.video.srcObject.getTracks().forEach(track => track.stop());
        elements.video.srcObject = null;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // Update UI
    state.isRunning = false;
    state.isDrowsy = false;
    stopAlarm();
    updateStatusBadge(false);
    elements.startBtn.classList.remove('hidden');
    elements.stopBtn.classList.add('hidden');
    
    // Reset progress bars
    elements.earProgress.style.width = '0%';
    elements.headAngleProgress.style.width = '0%';
    
    // Remove drowsy effect from video if applied
    elements.video.classList.remove('drowsy-effect');
    
    // Stop session timer
    if (state.sessionTimer) {
        clearInterval(state.sessionTimer);
        state.sessionTimer = null;
    }
    
    console.log('Detection stopped');
}

// Adjust canvas size to match video dimensions
function adjustCanvasSize() {
    const videoWidth = elements.video.clientWidth;
    const videoHeight = elements.video.clientHeight;
    
    elements.canvas.width = videoWidth;
    elements.canvas.height = videoHeight;
}

// Process FaceMesh results
function onFaceMeshResults(results) {
    if (!state.isRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Draw face mesh
        drawFaceMesh(landmarks);
        
        // Calculate EAR (Eye Aspect Ratio)
        const leftEAR = calculateEAR(landmarks, CONFIG.LEFT_EYE_LANDMARKS);
        const rightEAR = calculateEAR(landmarks, CONFIG.RIGHT_EYE_LANDMARKS);
        const avgEAR = (leftEAR + rightEAR) / 2;
        
        // Calculate head tilt angle
        const headTiltAngle = calculateHeadTilt(landmarks);
        
        // Update UI with values
        updateMetrics(avgEAR, headTiltAngle);
        
        // Check for drowsiness
        const isDrowsy = avgEAR < CONFIG.EAR_THRESHOLD || Math.abs(headTiltAngle) > CONFIG.HEAD_TILT_THRESHOLD;
        checkDrowsiness(isDrowsy);
    } else {
        // No face detected
        updateMetrics(0, 0);
        checkDrowsiness(false);
    }
}

// Draw face mesh landmarks on canvas
function drawFaceMesh(landmarks) {
    // Draw face oval outline
    drawFaceOval(landmarks);
    
    // Draw eyes with different color and style
    drawEyeContour(landmarks, CONFIG.LEFT_EYE_LANDMARKS, state.isDrowsy);
    drawEyeContour(landmarks, CONFIG.RIGHT_EYE_LANDMARKS, state.isDrowsy);
}

// Draw face oval outline
function drawFaceOval(landmarks) {
    ctx.beginPath();
    
    // Use face oval landmarks to draw face contour
    const ovalLandmarks = CONFIG.FACE_OVAL_LANDMARKS;
    
    // Scale first landmark coordinates to canvas size
    const startPoint = landmarks[ovalLandmarks[0]];
    ctx.moveTo(
        startPoint.x * elements.canvas.width,
        startPoint.y * elements.canvas.height
    );
    
    // Draw smooth curve connecting face oval landmarks
    for (let i = 1; i < ovalLandmarks.length; i++) {
        const point = landmarks[ovalLandmarks[i]];
        const x = point.x * elements.canvas.width;
        const y = point.y * elements.canvas.height;
        
        ctx.lineTo(x, y);
    }
    
    // Close the path back to the first point
    ctx.lineTo(
        startPoint.x * elements.canvas.width,
        startPoint.y * elements.canvas.height
    );
    
    // Set style based on drowsiness state
    if (state.isDrowsy) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red with transparency
    } else {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'; // Blue with transparency
    }
    
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Draw eye contour with enhanced styling
function drawEyeContour(landmarks, eyeLandmarks, isDrowsy) {
    ctx.beginPath();
    
    // Scale landmark coordinates to canvas size
    const startPoint = landmarks[eyeLandmarks[0]];
    ctx.moveTo(
        startPoint.x * elements.canvas.width,
        startPoint.y * elements.canvas.height
    );
    
    // Draw lines connecting eye landmarks
    for (let i = 1; i < eyeLandmarks.length; i++) {
        const point = landmarks[eyeLandmarks[i]];
        ctx.lineTo(
            point.x * elements.canvas.width,
            point.y * elements.canvas.height
        );
    }
    
    // Close the path back to the first point
    ctx.lineTo(
        startPoint.x * elements.canvas.width,
        startPoint.y * elements.canvas.height
    );
    
    // Set style based on drowsiness state
    if (isDrowsy) {
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Transparent red
    } else {
        ctx.strokeStyle = '#3b82f6'; // Blue
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Transparent blue
    }
    
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fill();
    
    // Draw pupil (center point of eye) for better visualization
    const topPoint = landmarks[eyeLandmarks[1]];
    const bottomPoint = landmarks[eyeLandmarks[5]];
    const leftPoint = landmarks[eyeLandmarks[0]];
    const rightPoint = landmarks[eyeLandmarks[3]];
    
    // Calculate center of eye
    const centerX = ((leftPoint.x + rightPoint.x) / 2) * elements.canvas.width;
    const centerY = ((topPoint.y + bottomPoint.y) / 2) * elements.canvas.height;
    
    // Draw pupil
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = isDrowsy ? '#ef4444' : '#3b82f6';
    ctx.fill();
}

// Calculate Eye Aspect Ratio (EAR)
function calculateEAR(landmarks, eyeLandmarks) {
    // Get the eye landmark points
    const points = eyeLandmarks.map(index => landmarks[index]);
    
    // Calculate the vertical distances
    const verticalDist1 = euclideanDistance(points[1], points[5]);
    const verticalDist2 = euclideanDistance(points[2], points[4]);
    
    // Calculate the horizontal distance
    const horizontalDist = euclideanDistance(points[0], points[3]);
    
    // Calculate EAR
    if (horizontalDist === 0) return 0;
    return (verticalDist1 + verticalDist2) / (2 * horizontalDist);
}

// Calculate head tilt angle
function calculateHeadTilt(landmarks) {
    // Use face oval landmarks to estimate head orientation
    const leftPoint = landmarks[234];  // Left side of face
    const rightPoint = landmarks[454]; // Right side of face
    const topPoint = landmarks[10];    // Top of face
    const bottomPoint = landmarks[152]; // Bottom of face
    
    // Calculate angle from vertical
    const dx = rightPoint.x - leftPoint.x;
    const dy = rightPoint.y - leftPoint.y;
    
    // Convert to degrees
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Normalize angle
    if (angle > 90) angle = 180 - angle;
    if (angle < -90) angle = -180 - angle;
    
    return angle;
}

// Calculate Euclidean distance between two points
function euclideanDistance(point1, point2) {
    return Math.sqrt(
        Math.pow(point1.x - point2.x, 2) + 
        Math.pow(point1.y - point2.y, 2) +
        Math.pow(point1.z - point2.z, 2)
    );
}

// Update metrics display
function updateMetrics(ear, headAngle) {
    // Update text values
    elements.earValue.textContent = ear.toFixed(2);
    elements.headAngleValue.textContent = `${Math.abs(headAngle).toFixed(1)}°`;
    
    // Update progress bars
    // EAR progress (0.1 to 0.4 range mapped to 0-100%)
    const earPercentage = Math.min(100, Math.max(0, ((ear - 0.1) / 0.3) * 100));
    elements.earProgress.style.width = `${earPercentage}%`;
    
    // Change color based on threshold
    if (ear < CONFIG.EAR_THRESHOLD) {
        elements.earProgress.classList.remove('bg-blue-500');
        elements.earProgress.classList.add('bg-red-500');
    } else {
        elements.earProgress.classList.remove('bg-red-500');
        elements.earProgress.classList.add('bg-blue-500');
    }
    
    // Head angle progress (0 to 45 degrees mapped to 0-100%)
    const absHeadAngle = Math.abs(headAngle);
    const headAnglePercentage = Math.min(100, Math.max(0, (absHeadAngle / 45) * 100));
    elements.headAngleProgress.style.width = `${headAnglePercentage}%`;
    
    // Change color based on threshold
    if (absHeadAngle > CONFIG.HEAD_TILT_THRESHOLD) {
        elements.headAngleProgress.classList.remove('bg-blue-500');
        elements.headAngleProgress.classList.add('bg-red-500');
    } else {
        elements.headAngleProgress.classList.remove('bg-red-500');
        elements.headAngleProgress.classList.add('bg-blue-500');
    }
}

// Check for drowsiness and manage alerts
function checkDrowsiness(isDrowsy) {
    const now = Date.now();
    
    if (isDrowsy) {
        if (!state.isDrowsy) {
            // Just became drowsy
            state.isDrowsy = true;
            state.drowsyStartTime = now;
            state.lastCheckTime = now;
            updateStatusBadge(true);
        } else {
            // Already drowsy, update total drowsy time for statistics
            if (state.lastCheckTime) {
                state.totalDrowsyTime += (now - state.lastCheckTime) / 1000;
                state.lastCheckTime = now;
            }
            
            // Check duration
            const drowsyDuration = (now - state.drowsyStartTime) / 1000;
            
            if (drowsyDuration >= CONFIG.DROWSY_TIME_THRESHOLD) {
                // Drowsy for too long, trigger alarm if sound is enabled
                if (state.soundEnabled) {
                    playAlarm();
                }
                
                // Log drowsy event (but not too frequently)
                if (now - state.lastDrowsyEventTime > 3000) { // Log at most every 3 seconds
                    logDrowsyEvent();
                    state.lastDrowsyEventTime = now;
                }
            }
        }
    } else {
        // Not drowsy
        if (state.isDrowsy) {
            // Was drowsy, now awake
            state.isDrowsy = false;
            state.drowsyStartTime = null;
            state.lastCheckTime = now;
            stopAlarm();
            updateStatusBadge(false);
        }
    }
}

// Update status badge
function updateStatusBadge(isDrowsy) {
    if (isDrowsy) {
        elements.statusBadge.textContent = '🔴 Drowsy';
        elements.statusBadge.classList.remove('status-awake');
        elements.statusBadge.classList.add('status-drowsy');
        elements.statusBadge.classList.add('pulse-animation');
        
        // Add visual effect to video
        elements.video.classList.add('drowsy-effect');
    } else {
        elements.statusBadge.textContent = '🟢 Awake';
        elements.statusBadge.classList.remove('status-drowsy');
        elements.statusBadge.classList.remove('pulse-animation');
        elements.statusBadge.classList.add('status-awake');
        
        // Remove visual effect from video
        elements.video.classList.remove('drowsy-effect');
    }
}

// Log drowsy event
function logDrowsyEvent() {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry text-sm py-2 px-1 animate-fadeIn';
    
    // Create a more visually appealing log entry
    logEntry.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <span class="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span class="font-medium">Drowsy Detected</span>
            </div>
            <span class="log-time">${timestamp}</span>
        </div>
    `;
    
    // Remove placeholder if it exists
    const placeholder = elements.drowsyLog.querySelector('.text-gray-400');
    if (placeholder) {
        elements.drowsyLog.removeChild(placeholder);
    }
    
    // Add new entry at the top with fade-in animation
    logEntry.style.opacity = '0';
    elements.drowsyLog.insertBefore(logEntry, elements.drowsyLog.firstChild);
    
    // Trigger animation
    setTimeout(() => {
        logEntry.style.opacity = '1';
        logEntry.style.transition = 'opacity 0.3s ease-in';
    }, 10);
    
    // Update statistics
    state.drowsyEvents++;
    
    // Calculate response time (time from drowsy detection to now)
    if (state.drowsyStartTime) {
        const responseTime = (Date.now() - state.drowsyStartTime) / 1000;
        state.responseTimeSum += responseTime;
    }
    
    // Update session statistics
    updateSessionStats();
}

// Clear drowsy log
function clearDrowsyLog() {
    elements.drowsyLog.innerHTML = '<p class="text-gray-400 text-sm italic">No events recorded yet</p>';
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', initApp);