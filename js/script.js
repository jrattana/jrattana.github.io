/* ============================================
   HOT AIR BALLOON PORTFOLIO
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the main page or a subpage
    const isSubpage = document.body.classList.contains('subpage');
    
    if (isSubpage) {
        // Initialize subpage functionality
        initSubpageWindow();
        // Also initialize audio on subpages
        initAudioWaveform();
    } else {
        // Initialize main page functionality
        initMainBalloon();
        initAudioWaveform();
    }
    
    // Initialize dynamic page loading for seamless audio
    initDynamicNavigation();
});

/* ============================================
   AUDIO WAVEFORM VISUALIZATION
   ============================================ */
let audioContext = null;
let analyser = null;
let dataArray = null;
let animationId = null;

// Playlist configuration
const playlist = [
    { file: 'songs/Stagefright - Code Man.mp3', title: 'Code Man', artist: 'Stagefright' },
    { file: 'songs/Stagefright - Down The Hill.mp3', title: 'Down The Hill', artist: 'Stagefright' },
    { file: 'songs/Stagefright - Pauline.mp3', title: 'Pauline', artist: 'Stagefright' },
    { file: 'songs/Thrown-Out Bones - Feel It In Your Bite.mp3', title: 'Feel It In Your Bite', artist: 'Thrown-Out Bones' },
    { file: 'songs/Thrown-Out Bones - Hoodiladiloo.mp3', title: 'Hoodiladiloo', artist: 'Thrown-Out Bones' }
];

// Band bios
const bandBios = {
    'Thrown-Out Bones': 'Thrown-Out Bones kindly authorized the use of their music. <a href="https://www.thrownoutbones.com/" target="_blank">Check them out.</a> Based in the SF Bay Area.',
    'Stagefright': 'Stagefright kindly authorized the use of their music. <a href="https://stagefright.bandcamp.com/" target="_blank">Check them out.</a> Based in Wonder Valley, CA.'
};

let shuffledPlaylist = [];
let currentTrackIndex = 0;

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Get or create shuffled playlist (persists across pages in session)
function getShuffledPlaylist() {
    const stored = sessionStorage.getItem('shuffledPlaylist');
    if (stored) {
        return JSON.parse(stored);
    }
    // First visit - shuffle and store
    const shuffled = shuffleArray(playlist);
    sessionStorage.setItem('shuffledPlaylist', JSON.stringify(shuffled));
    return shuffled;
}

// Save current playback state
function savePlaybackState(trackIndex, currentTime, isPlaying) {
    sessionStorage.setItem('currentTrackIndex', trackIndex.toString());
    sessionStorage.setItem('currentTime', currentTime.toString());
    sessionStorage.setItem('isPlaying', isPlaying.toString());
}

// Get saved playback state
function getPlaybackState() {
    return {
        trackIndex: parseInt(sessionStorage.getItem('currentTrackIndex') || '0'),
        currentTime: parseFloat(sessionStorage.getItem('currentTime') || '0'),
        isPlaying: sessionStorage.getItem('isPlaying') === 'true'
    };
}

function initAudioWaveform() {
    const audio = document.getElementById('backgroundAudio');
    const canvas = document.getElementById('waveformCanvas');
    const controlBtn = document.getElementById('audioControl');
    const skipBtn = document.getElementById('skipControl');
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const bandBio = document.getElementById('bandBio');
    
    if (!audio) return;
    
    const hasCanvas = !!canvas;
    
    // Get shuffled playlist (only shuffles on first site visit)
    shuffledPlaylist = getShuffledPlaylist();
    
    // Restore playback state
    const savedState = getPlaybackState();
    currentTrackIndex = savedState.trackIndex;
    
    // Load the current track
    loadTrack(currentTrackIndex, false);
    
    // Restore playback position after metadata loads
    audio.addEventListener('loadedmetadata', () => {
        if (savedState.currentTime > 0) {
            audio.currentTime = savedState.currentTime;
        }
    }, { once: true });
    
    // Set canvas size (only on main page)
    if (hasCanvas) {
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    // Load a track by index
    function loadTrack(index, showBio = true) {
        const track = shuffledPlaylist[index];
        audio.src = track.file;
        
        // Update track info
        if (trackTitle) trackTitle.textContent = track.title;
        if (trackArtist) trackArtist.textContent = track.artist;
        
        // Update band bio content (but don't show until playing)
        if (bandBio) {
            const bio = bandBios[track.artist];
            if (bio) {
                // Create bio content with close button
                bandBio.innerHTML = `<button class="band-bio-close" aria-label="Close">×</button>${bio}`;
                
                // Add close button event listener
                const closeBtn = bandBio.querySelector('.band-bio-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        bandBio.classList.remove('visible');
                        bioShown = false;
                        bioClosed = true; // Track that user manually closed the bio
                    });
                }
                
                // Only show if audio is playing
                if (showBio && !audio.paused) {
                    bandBio.classList.add('visible');
                }
            } else {
                bandBio.innerHTML = '';
                bandBio.classList.remove('visible');
            }
        }
        
        // Save state
        savePlaybackState(index, 0, false);
    }
    
    // Track if bio has been shown (persists until track change)
    let bioShown = false;
    let bioClosed = false; // Track if user manually closed the bio
    
    // Update bio visibility - once shown, stays visible until track changes or user closes
    function updateBioVisibility(forceShow = false) {
        if (bandBio) {
            const track = shuffledPlaylist[currentTrackIndex];
            const bio = bandBios[track.artist];
            // Don't show if user manually closed it for this track
            if (bio && (forceShow || bioShown) && !bioClosed) {
                bioShown = true;
                bandBio.classList.add('visible');
            }
        }
    }
    
    // Reset bio visibility (called when track changes)
    function resetBioVisibility() {
        bioShown = false;
        bioClosed = false; // Reset closed state for new track
        if (bandBio) {
            bandBio.classList.remove('visible');
        }
    }
    
    // Initialize audio context
    function initAudioContext() {
        if (audioContext) {
            // Audio context already exists, but make sure waveform is running
            startWaveformIfNeeded();
            return;
        }
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        startWaveformIfNeeded();
    }

    // Toggle play/pause
    function toggleAudio() {
        initAudioContext();
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        if (audio.paused) {
            audio.play();
            if (controlBtn) controlBtn.classList.add('playing');
            updateBioVisibility(true); // Show bio on first play
        } else {
            audio.pause();
            if (controlBtn) controlBtn.classList.remove('playing');
            // Bio stays visible when paused
        }
    }
    
    // Skip to next track
    function skipTrack() {
        initAudioContext();
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Clear waveform history for fresh start
        waveformHistory = [];
        
        // Reset bio for new track
        resetBioVisibility();
        
        // Move to next track (loop back to start if at end)
        currentTrackIndex = (currentTrackIndex + 1) % shuffledPlaylist.length;
        loadTrack(currentTrackIndex);
        
        // Play the new track
        audio.play();
        if (controlBtn) controlBtn.classList.add('playing');
        updateBioVisibility(true); // Show bio for new track
    }
    
    // Play/pause button click
    if (controlBtn) {
        controlBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAudio();
        });
    }
    
    // Skip button click
    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            skipTrack();
        });
    }
    
    // Auto-play next track when current ends
    audio.addEventListener('ended', () => {
        // Clear waveform history for fresh start
        waveformHistory = [];
        
        // Reset bio for new track
        resetBioVisibility();
        
        // Move to next track
        currentTrackIndex = (currentTrackIndex + 1) % shuffledPlaylist.length;
        loadTrack(currentTrackIndex);
        
        // Auto-play next track
        audio.play();
        updateBioVisibility(true); // Show bio for new track
    });
    
    // Save state periodically and before leaving page
    setInterval(() => {
        if (!audio.paused) {
            savePlaybackState(currentTrackIndex, audio.currentTime, true);
        }
    }, 1000);
    
    window.addEventListener('beforeunload', () => {
        savePlaybackState(currentTrackIndex, audio.currentTime, !audio.paused);
    });
    
    // Update button state based on audio events
    audio.addEventListener('play', () => {
        if (controlBtn) controlBtn.classList.add('playing');
        updateBioVisibility(true); // Show bio on play
        savePlaybackState(currentTrackIndex, audio.currentTime, true);
    });
    
    audio.addEventListener('pause', () => {
        if (controlBtn) controlBtn.classList.remove('playing');
        // Bio stays visible when paused
        savePlaybackState(currentTrackIndex, audio.currentTime, false);
    });
    
    // Removed click-anywhere-to-start behavior
    // User must explicitly click the play button to start audio
    
    // If music was playing before (e.g., page refresh), show bio but don't auto-play
    // User must press play button to start - browser autoplay policies prevent auto-start anyway
    if (savedState.isPlaying) {
        // Just show bio indicating they were listening, but don't auto-play
        bioShown = true;
        updateBioVisibility(true);
    }
}

let waveformHistory = [];
const barCount = 128; // Number of bars around the circle

// Start waveform animation if canvas exists and animation isn't running (global function)
function startWaveformIfNeeded() {
    const currentCanvas = document.getElementById('waveformCanvas');
    if (currentCanvas && audioContext && analyser && dataArray) {
        currentCanvas.width = window.innerWidth;
        currentCanvas.height = window.innerHeight;
        const currentCtx = currentCanvas.getContext('2d');
        // Cancel existing animation and restart
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        drawWaveform(currentCtx, currentCanvas);
    }
}

function drawWaveform(ctx, canvas) {
    if (!analyser || !dataArray) return;
    
    animationId = requestAnimationFrame(() => drawWaveform(ctx, canvas));
    
    // Get time-domain data (actual waveform)
    analyser.getByteTimeDomainData(dataArray);
    
    // Sample the waveform to get bar values
    const newBars = [];
    for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor((i / barCount) * dataArray.length);
        // Get absolute amplitude (0 to 1)
        const amplitude = Math.abs(dataArray[dataIdx] - 128) / 128;
        newBars.push(amplitude);
    }
    
    // Add new bars to history (shift the pattern around the circle)
    waveformHistory.unshift(...newBars.slice(0, 2));
    while (waveformHistory.length > barCount) {
        waveformHistory.pop();
    }
    // Fill with zeros if not enough data yet
    while (waveformHistory.length < barCount) {
        waveformHistory.push(0);
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get portal position and size
    const portal = document.querySelector('.portal');
    if (!portal) return;
    
    const portalRect = portal.getBoundingClientRect();
    const centerX = portalRect.left + portalRect.width / 2;
    const centerY = portalRect.top + portalRect.height / 2;
    const portalRadius = portalRect.width / 2;
    
    const baseRadius = portalRadius + 20;
    const maxBarHeight = 100;
    const minBarHeight = 5;
    
    // Fixed playhead position at top (12 o'clock)
    const playheadAngle = -Math.PI / 2;
    
    // Draw radial bars
    for (let i = 0; i < barCount; i++) {
        const angle = playheadAngle + (i / barCount) * Math.PI * 2;
        const amplitude = waveformHistory[i] || 0;
        
        // Fade based on position (older = more faded)
        const ageFade = 1 - (i / barCount) * 0.6;
        
        // Calculate bar height
        const barHeight = minBarHeight + amplitude * maxBarHeight * ageFade;
        
        // Inner and outer points of the bar
        const innerRadius = baseRadius;
        const outerRadius = baseRadius + barHeight;
        
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;
        
        // Draw bar with gradient - more prominent colors
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        const alpha = 0.7 + amplitude * 0.3;
        gradient.addColorStop(0, `rgba(212, 175, 55, ${alpha * ageFade})`);
        gradient.addColorStop(0.5, `rgba(255, 235, 180, ${alpha * ageFade})`);
        gradient.addColorStop(1, `rgba(212, 175, 55, ${alpha * 0.5 * ageFade})`);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    
    // Draw subtle base circle - slightly more visible
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Draw playhead indicator at top
    const currentAmplitude = waveformHistory[0] || 0;
    const playheadOuter = baseRadius + minBarHeight + currentAmplitude * maxBarHeight + 10;
    
    ctx.beginPath();
    ctx.moveTo(
        centerX + Math.cos(playheadAngle) * (baseRadius - 8),
        centerY + Math.sin(playheadAngle) * (baseRadius - 8)
    );
    ctx.lineTo(
        centerX + Math.cos(playheadAngle) * playheadOuter,
        centerY + Math.sin(playheadAngle) * playheadOuter
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Glow dot at playhead
    ctx.beginPath();
    ctx.arc(
        centerX + Math.cos(playheadAngle) * baseRadius,
        centerY + Math.sin(playheadAngle) * baseRadius,
        4,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
}

/* ============================================
   MAIN PAGE - BALLOON ANIMATION
   ============================================ */
let balloonsLaunched = false;

function initMainBalloon() {
    const balloonImage = document.getElementById('balloonImage');
    const risingText = document.getElementById('risingText');
    const sideNav = document.getElementById('sideNav');
    const audioBar = document.getElementById('audioBar');
    
    if (!balloonImage) return;
    
    // Check if user has already seen the animation this session
    const hasSeenAnimation = sessionStorage.getItem('hasSeenAnimation');
    
    if (hasSeenAnimation) {
        // Skip animation - show final state immediately
        balloonImage.classList.add('risen'); // Final state, no animation
        if (risingText) risingText.classList.add('risen');
        if (sideNav) sideNav.classList.add('visible');
        if (audioBar) audioBar.classList.add('risen');
        balloonsLaunched = true;
        return;
    }
    
    // First visit - play the animation
    setTimeout(() => {
        if (balloonsLaunched) return;
        balloonsLaunched = true;
        
        // Add rising animation to the balloon image
        balloonImage.classList.add('rising');
        
        // Start rising text at the same time
        if (risingText) risingText.classList.add('rising');
        
        // Start audio bar animation at the same time
        if (audioBar) audioBar.classList.add('rising');
        
        // Show side navigation after balloon rises
        setTimeout(() => {
            if (sideNav) sideNav.classList.add('visible');
            
            // Mark that user has seen the animation
            sessionStorage.setItem('hasSeenAnimation', 'true');
        }, 4000);
        
    }, 1500); // Start after 1.5 seconds
}

/* ============================================
   SUBPAGE - WINDOW FUNCTIONALITY
   ============================================ */
function initSubpageWindow() {
    const pageWindow = document.querySelector('.page-window');
    if (!pageWindow) return;
    
    // Initialize scrollbars for the page window
    initScrollbars(pageWindow);
    
    // Initialize image galleries
    initImageGalleries();
    
    // Initialize media carousel
    initMediaCarousel();
}

/* ============================================
   MEDIA CAROUSEL
   ============================================ */
function initMediaCarousel() {
    const carousel = document.getElementById('mediaCarousel');
    if (!carousel) return;
    
    const container = carousel.querySelector('.carousel-container');
    const items = carousel.querySelectorAll('.carousel-item');
    const dots = carousel.querySelectorAll('.dot');
    const prevBtn = carousel.querySelector('.prev-btn');
    const nextBtn = carousel.querySelector('.next-btn');
    
    if (items.length === 0) return;
    
    let currentIndex = 0;
    
    function showItem(index) {
        // Handle wrapping
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        
        // Pause any playing videos
        items.forEach(item => {
            if (item.tagName === 'VIDEO') {
                item.pause();
            }
            item.classList.remove('active');
        });
        
        // Update dots
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Show current item
        items[index].classList.add('active');
        dots[index].classList.add('active');
        
        // Auto-play video if it's a video
        if (items[index].tagName === 'VIDEO') {
            items[index].play();
        }
        
        currentIndex = index;
    }
    
    // Previous button
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showItem(currentIndex - 1);
        });
    }
    
    // Next button
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showItem(currentIndex + 1);
        });
    }
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showItem(index);
        });
    });
    
    // Click on container to go to next
    if (container) {
        container.addEventListener('click', () => {
            showItem(currentIndex + 1);
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            showItem(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            showItem(currentIndex + 1);
        }
    });
}

/* ============================================
   IMAGE GALLERY
   ============================================ */
function initImageGalleries() {
    // Find galleries (both standalone and with balloons)
    const galleries = document.querySelectorAll('.photo-with-balloons, .image-gallery');
    
    galleries.forEach(gallery => {
        const container = gallery.querySelector('.gallery-image-container');
        const images = gallery.querySelectorAll('.gallery-image');
        
        // Caption can be inside gallery or as a sibling
        let caption = gallery.querySelector('.gallery-caption');
        if (!caption) {
            caption = gallery.nextElementSibling;
            if (caption && !caption.classList.contains('gallery-caption')) {
                caption = null;
            }
        }
        
        if (!container || images.length === 0) return;
        
        // Captions for each image
        const captions = [
            'Solder connections on the back of the perfboard',
            'Front side with headers and wiring attached',
            'Completed sensor probe with all components mounted'
        ];
        
        let currentIndex = 0;
        
        // Click to cycle through images
        container.addEventListener('click', () => {
            // Hide current image
            images[currentIndex].classList.remove('active');
            
            // Move to next image
            currentIndex = (currentIndex + 1) % images.length;
            
            // Show new image
            images[currentIndex].classList.add('active');
            
            // Update caption
            if (caption) {
                caption.textContent = captions[currentIndex];
            }
        });
    });
}

/* ============================================
   FUNCTIONAL SCROLLBARS
   ============================================ */
function initScrollbars(windowEl) {
    const content = windowEl.querySelector('.window-content');
    const scrollBoxV = windowEl.querySelector('.scroll-box-v');
    const scrollBoxH = windowEl.querySelector('.scroll-box-h');
    const trackV = windowEl.querySelector('.scroll-track-v');
    const trackH = windowEl.querySelector('.scroll-track-h');
    const scrollUp = windowEl.querySelector('.scroll-up');
    const scrollDown = windowEl.querySelector('.scroll-down');
    
    if (!content) return;
    
    const scrollAmount = 15; // Pixels to scroll per click
    
    // Update scroll box positions when content is scrolled
    content.addEventListener('scroll', () => {
        updateScrollBoxes(content, scrollBoxV, scrollBoxH, trackV, trackH);
    });
    
    // Initial update
    setTimeout(() => {
        updateScrollBoxes(content, scrollBoxV, scrollBoxH, trackV, trackH);
    }, 100);
    
    // Scroll up button
    if (scrollUp) {
        let scrollUpInterval;
        
        scrollUp.addEventListener('mousedown', () => {
            content.scrollTop -= scrollAmount;
            scrollUpInterval = setInterval(() => {
                content.scrollTop -= scrollAmount;
            }, 100);
        });
        
        scrollUp.addEventListener('mouseup', () => {
            clearInterval(scrollUpInterval);
        });
        
        scrollUp.addEventListener('mouseleave', () => {
            clearInterval(scrollUpInterval);
        });
    }
    
    // Scroll down button
    if (scrollDown) {
        let scrollDownInterval;
        
        scrollDown.addEventListener('mousedown', () => {
            content.scrollTop += scrollAmount;
            scrollDownInterval = setInterval(() => {
                content.scrollTop += scrollAmount;
            }, 100);
        });
        
        scrollDown.addEventListener('mouseup', () => {
            clearInterval(scrollDownInterval);
        });
        
        scrollDown.addEventListener('mouseleave', () => {
            clearInterval(scrollDownInterval);
        });
    }
    
    // Make vertical scroll box draggable
    if (scrollBoxV && trackV) {
        makeDraggable(scrollBoxV, trackV, content, 'vertical');
    }
    
    // Make horizontal scroll box draggable
    if (scrollBoxH && trackH) {
        makeDraggable(scrollBoxH, trackH, content, 'horizontal');
    }
    
    // Click on track to scroll
    if (trackV) {
        trackV.addEventListener('click', (e) => {
            if (e.target === trackV) {
                const rect = trackV.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const trackHeight = trackV.clientHeight;
                const scrollRatio = clickY / trackHeight;
                content.scrollTop = scrollRatio * (content.scrollHeight - content.clientHeight);
            }
        });
    }
    
    if (trackH) {
        trackH.addEventListener('click', (e) => {
            if (e.target === trackH) {
                const rect = trackH.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const trackWidth = trackH.clientWidth;
                const scrollRatio = clickX / trackWidth;
                content.scrollLeft = scrollRatio * (content.scrollWidth - content.clientWidth);
            }
        });
    }
}

function updateScrollBoxes(content, scrollBoxV, scrollBoxH, trackV, trackH) {
    // Vertical scroll box
    if (scrollBoxV && trackV) {
        const scrollableHeight = content.scrollHeight - content.clientHeight;
        const maxTop = trackV.clientHeight - scrollBoxV.offsetHeight;
        
        if (scrollableHeight > 0) {
            const scrollRatio = content.scrollTop / scrollableHeight;
            const newTop = Math.min(Math.max(0, scrollRatio * maxTop), maxTop);
            scrollBoxV.style.top = newTop + 'px';
        } else {
            scrollBoxV.style.top = '0px';
        }
    }
    
    // Horizontal scroll box
    if (scrollBoxH && trackH) {
        const scrollableWidth = content.scrollWidth - content.clientWidth;
        const maxLeft = trackH.clientWidth - scrollBoxH.offsetWidth;
        
        if (scrollableWidth > 0) {
            const scrollRatio = content.scrollLeft / scrollableWidth;
            const newLeft = Math.min(Math.max(0, scrollRatio * maxLeft), maxLeft);
            scrollBoxH.style.left = newLeft + 'px';
        } else {
            scrollBoxH.style.left = '0px';
        }
    }
}

function makeDraggable(scrollBox, track, content, direction) {
    let isDragging = false;
    let startPos = 0;
    let startScroll = 0;
    
    scrollBox.addEventListener('mousedown', (e) => {
        isDragging = true;
        scrollBox.style.cursor = 'grabbing';
        
        if (direction === 'vertical') {
            startPos = e.clientY;
            startScroll = content.scrollTop;
        } else {
            startPos = e.clientX;
            startScroll = content.scrollLeft;
        }
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        if (direction === 'vertical') {
            const deltaY = e.clientY - startPos;
            const trackHeight = track.clientHeight - scrollBox.clientHeight;
            const scrollableHeight = content.scrollHeight - content.clientHeight;
            const scrollDelta = (deltaY / trackHeight) * scrollableHeight;
            content.scrollTop = startScroll + scrollDelta;
        } else {
            const deltaX = e.clientX - startPos;
            const trackWidth = track.clientWidth - scrollBox.clientWidth;
            const scrollableWidth = content.scrollWidth - content.clientWidth;
            const scrollDelta = (deltaX / trackWidth) * scrollableWidth;
            content.scrollLeft = startScroll + scrollDelta;
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            scrollBox.style.cursor = 'grab';
        }
    });
    
    // Set initial cursor
    scrollBox.style.cursor = 'grab';
}

/* ============================================
   DYNAMIC PAGE NAVIGATION (keeps audio playing)
   ============================================ */
function initDynamicNavigation() {
    // Set initial history state for current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    history.replaceState({ page: currentPage }, document.title, currentPage);
    
    // Intercept clicks on internal navigation links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Only handle internal links (not external, not downloads, not anchors)
        if (href.startsWith('http') || href.startsWith('#') || link.hasAttribute('download')) {
            return;
        }
        
        // Only handle .html pages
        if (!href.endsWith('.html')) {
            return;
        }
        
        e.preventDefault();
        loadPage(href);
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
            loadPage(e.state.page, false);
        }
    });
}

async function loadPage(url, pushState = true) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        
        // Parse the fetched HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get the new body content (excluding audio elements we want to preserve)
        const newBody = doc.body;
        const isNewPageSubpage = newBody.classList.contains('subpage');
        
        // Get existing elements to preserve (if they exist)
        const existingAudio = document.getElementById('backgroundAudio');
        const existingCanvas = document.getElementById('waveformCanvas');
        
        // Get new page's canvas (in case we need it)
        const newCanvas = newBody.querySelector('#waveformCanvas');
        
        // Update body class
        if (isNewPageSubpage) {
            document.body.classList.add('subpage');
        } else {
            document.body.classList.remove('subpage');
        }
        
        // Get the new content (everything except audio-related elements we want to handle specially)
        const newContent = [];
        newBody.childNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
                const id = node.id;
                // Skip audio elements - we'll handle them separately
                if (id === 'backgroundAudio' || id === 'audioBar' || id === 'waveformCanvas') {
                    return;
                }
                newContent.push(node.cloneNode(true));
            }
        });
        
        // Remove old content (except audio elements we're preserving)
        const elementsToRemove = [];
        document.body.childNodes.forEach(node => {
            if (node.nodeType === 1) {
                const id = node.id;
                if (id !== 'backgroundAudio' && id !== 'audioBar' && id !== 'waveformCanvas') {
                    elementsToRemove.push(node);
                }
            }
        });
        elementsToRemove.forEach(el => el.remove());
        
        // If navigating to main page and we don't have a canvas, add it from the new page
        if (!isNewPageSubpage && !existingCanvas && newCanvas) {
            document.body.insertBefore(newCanvas.cloneNode(true), document.body.firstChild);
        }
        
        // Add new content before audio elements
        const insertBeforeEl = existingAudio || existingCanvas || document.body.firstChild;
        newContent.forEach(node => {
            if (insertBeforeEl) {
                document.body.insertBefore(node, insertBeforeEl);
            } else {
                document.body.appendChild(node);
            }
        });
        
        // Make sure audio bar is visible on subpages
        const audioBar = document.getElementById('audioBar');
        if (audioBar) {
            audioBar.classList.add('risen');
        }
        
        // Handle waveform canvas visibility
        const waveformCanvas = document.getElementById('waveformCanvas');
        if (waveformCanvas) {
            if (isNewPageSubpage) {
                waveformCanvas.style.display = 'none';
            } else {
                waveformCanvas.style.display = 'block';
                // Restart waveform drawing if audio context exists
                startWaveformIfNeeded();
            }
        }
        
        // Update page title
        document.title = doc.title;
        
        // Update URL
        if (pushState) {
            history.pushState({ page: url }, doc.title, url);
        }
        
        // Re-initialize page-specific functionality
        if (isNewPageSubpage) {
            initSubpageWindow();
        } else {
            initMainBalloon();
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
        
    } catch (error) {
        console.error('Error loading page:', error);
        // Fallback to regular navigation
        window.location.href = url;
    }
}
