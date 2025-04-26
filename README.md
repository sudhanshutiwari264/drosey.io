# DrowzAlert - Advanced Driver Drowsiness Detection System

![BTech Project](https://img.shields.io/badge/BTech-Major%20Project-green)
![Version](https://img.shields.io/badge/version-1.0.0-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

DrowzAlert is an advanced driver drowsiness detection system developed as a BTech major project in Computer Science & Engineering. The system uses computer vision and deep learning techniques to monitor driver alertness in real-time, helping to prevent accidents caused by driver fatigue.

## Features

- Real-time webcam access and video feed display
- Face detection and facial landmark tracking using MediaPipe FaceMesh
- Drowsiness detection based on:
  - Eye Aspect Ratio (EAR) to detect prolonged eye closure
  - Head tilt angle to monitor head dropping (nodding off)
- Visual status indicator (Awake/Drowsy)
- Audible alarm when drowsiness is detected for a prolonged period
- Drowsiness event logging with timestamps
- Customizable detection settings:
  - Adjustable Eye Aspect Ratio threshold
  - Configurable head tilt angle threshold
  - Customizable drowsiness duration before alarm
- Settings persistence using localStorage
- Progressive Web App (PWA) capabilities for offline use

## Tech Stack

- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
- **Libraries**:
  - MediaPipe FaceMesh for facial landmarks detection
  - Tone.js for audio alerts
- **Storage**: localStorage for settings persistence
- **PWA Features**:
  - Service Worker for offline capabilities
  - Web App Manifest for installability

## How It Works

1. The application accesses the user's webcam and displays the live video feed.
2. MediaPipe FaceMesh is used to detect facial landmarks in real-time.
3. The application calculates:
   - Eye Aspect Ratio (EAR): The ratio of eye height to width, which decreases when eyes close
   - Head tilt angle: To detect if the head is dropping (nodding off)
4. If the EAR falls below a threshold or the head tilt exceeds a threshold for a specified duration, the user is classified as "Drowsy".
5. When drowsiness is detected for more than the configured threshold time, an alarm sound is played to alert the driver.
6. All drowsy events are logged with timestamps.

## Usage

1. Open the application in a modern web browser.
2. Grant camera permissions when prompted.
3. (Optional) Click the "Settings" button to customize detection thresholds:
   - Eye Aspect Ratio (EAR) threshold: Lower values make the system more sensitive to eye closure
   - Head tilt threshold: Lower values make the system more sensitive to head tilting
   - Drowsy time threshold: How long drowsiness must be detected before the alarm sounds
4. Click the "Start Detection" button to begin drowsiness monitoring.
5. The application will display your webcam feed with facial landmarks overlaid.
6. Your drowsiness status will be shown in the top-right corner of the video feed.
7. If drowsiness is detected for a prolonged period, an alarm will sound.
8. The drowsiness events will be logged with timestamps in the Drowsiness Log panel.
9. Click "Stop Detection" to end the monitoring session.

## Installation and Running

### Option 1: Direct File Opening
Simply open the `index.html` file in a modern web browser. However, some features like the service worker for offline capabilities may not work properly when opening files directly.

### Option 2: Using a Local Server (Recommended)
For the best experience, run the application using a local web server:

1. If you have Python installed:
   ```
   # Python 3
   python -m http.server
   
   # Python 2
   python -m SimpleHTTPServer
   ```

2. If you have Node.js installed:
   ```
   # Install http-server globally if you haven't already
   npm install -g http-server
   
   # Run the server
   http-server
   ```

3. Then open your browser and navigate to:
   ```
   http://localhost:8000
   ```

This method ensures all features, including the service worker for offline capabilities, work correctly.

## Browser Compatibility

DrowzAlert works best in modern browsers with WebRTC support:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

## Limitations

- This is an MVP (Minimum Viable Product) and should not be relied upon for actual driving safety.
- Performance may vary based on the user's hardware and lighting conditions.
- The application requires a webcam and may not work on all devices.

## Future Improvements

### Future Research Directions
Based on our initial findings, we've identified several promising areas for future research:

- **Integration with Vehicle Systems**:
  - Direct integration with vehicle telematics
  - Automated vehicle response to detected drowsiness
  - Integration with Advanced Driver Assistance Systems (ADAS)

- **Enhanced Detection Capabilities**:
  - Multi-modal detection using physiological signals
  - Improved performance in challenging lighting conditions
  - Personalized drowsiness profiles using machine learning

- **Extended Research Applications**:
  - Applications in medical monitoring for sleep disorders
  - Fatigue monitoring in high-risk occupations
  - Cognitive load assessment for complex tasks

- **Advanced Analytics**:
  - Predictive modeling of drowsiness patterns
  - Correlation with environmental and physiological factors
  - Large-scale data collection and analysis

### Additional Planned Improvements
- Implement more sophisticated drowsiness detection algorithms
- Add multiple alarm sound options
- Improve performance on mobile devices
- Add vibration alerts for mobile devices
- Implement data analytics for drowsiness patterns
- Add support for multiple languages
- Implement a more robust face detection model for varying lighting conditions
- Add notifications to remind users to take breaks

## Research Methodology

Our research followed a systematic approach:

1. **Problem Definition**: Identifying the need for non-intrusive drowsiness detection
2. **Data Collection**: Gathering facial expressions in various lighting conditions
3. **Algorithm Development**: Implementing and optimizing detection algorithms
4. **Testing & Validation**: Rigorous testing across different subjects and conditions
5. **Performance Analysis**: Measuring accuracy, response time, and false positive rates

## Results

- **Accuracy**: 94.2% in detecting drowsiness states
- **F1 Score**: 0.89
- **Average Response Time**: 2.1 seconds

For detailed results and methodology, please refer to our [Technical Paper](https://drive.google.com/file/d/1a1hjh5bM2UbduTgrgwi0z2WByOyEtr8T/view?usp=sharing).

## Project Team

- Sudhanshu Tiwari
- Yash Poli

## Academic Supervision

- Prof. Sumithra Sethi
- Department of Computer Science & Engineering

## Disclaimer

DrowzAlert is a research project and should not be used as a substitute for proper rest before driving. No application can replace the importance of being well-rested while operating a vehicle. This system should not be relied upon for actual driving safety without proper validation and certification.

## License

This project is open source and available under the MIT License.

---

© 2025 DrowzAlert | BTech Major Project | Computer Science & Engineering