/* ============================================
   HOT AIR BALLOON PORTFOLIO
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the main page or a subpage
    const isSubpage = document.body.classList.contains('subpage');
    
    if (isSubpage) {
        // Initialize subpage functionality
        initSubpageWindow();
    } else {
        // Initialize main page functionality
        initMainBalloon();
    }
});

/* ============================================
   MAIN PAGE - BALLOON ANIMATION
   ============================================ */
let balloonsLaunched = false;

function initMainBalloon() {
    const balloonImage = document.getElementById('balloonImage');
    const risingText = document.getElementById('risingText');
    const sideNav = document.getElementById('sideNav');
    
    if (!balloonImage) return;
    
    // Check if user has already seen the animation this session
    const hasSeenAnimation = sessionStorage.getItem('hasSeenAnimation');
    
    if (hasSeenAnimation) {
        // Skip animation - show final state immediately
        balloonImage.classList.add('risen'); // Final state, no animation
        if (risingText) risingText.classList.add('risen');
        if (sideNav) sideNav.classList.add('visible');
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
