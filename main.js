document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    try {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch(e) { console.error('Lucide error:', e); }

    // Setup Lenis Smooth Scrolling
    let lenis;
    try {
        if (typeof Lenis !== 'undefined') {
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                mouseMultiplier: 1,
                smoothTouch: false,
                touchMultiplier: 2,
                infinite: false,
            });

            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }
    } catch(e) { console.error('Lenis error:', e); }

    // GSAP ScrollTrigger setup with Lenis
    try {
        if (typeof gsap !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    } catch(e) { console.error('GSAP plugin error:', e); }
    
    // Custom Cursor
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');
    
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0 });
        gsap.to(cursorFollower, { x: e.clientX, y: e.clientY, duration: 0.15 });
    });

    // Magnetic Buttons & Cursor Hover State
    const magneticBtns = document.querySelectorAll('.magnetic-btn, button, a');
    
    magneticBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        btn.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
            gsap.to(btn, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
        });
        
        if (btn.classList.contains('magnetic-btn')) {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const h = rect.width / 2;
                const w = rect.height / 2;
                const x = e.clientX - rect.left - h;
                const y = e.clientY - rect.top - w;
                
                gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
            });
        }
    });

    // Loading Animation
    const loader = document.querySelector('.loader');
    const progressFill = document.querySelector('.loader .progress');
    
    function hideLoaderFallback() {
        if (loader) {
            loader.style.display = 'none';
            document.body.classList.remove('loading');
        }
    }

    if (typeof gsap !== 'undefined') {
        gsap.to(progressFill, {
            width: '100%',
            duration: 2,
            ease: 'power2.inOut',
            onComplete: () => {
                gsap.to(loader, {
                    yPercent: -100,
                    duration: 1,
                    ease: 'power4.inOut',
                    onComplete: () => {
                        document.body.classList.remove('loading');
                        initHeroAnimations();
                    }
                });
            }
        });
        
        // Failsafe if animation gets stuck
        setTimeout(hideLoaderFallback, 4000);
    } else {
        hideLoaderFallback();
    }

    function initHeroAnimations() {
        gsap.from('.hero h1', { scale: 0.8, filter: 'blur(10px)', opacity: 0, duration: 1.5, ease: 'power4.out', delay: 0.2 });
        gsap.from('.hero h3', { x: -50, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.5 });
        gsap.from('.hero p', { y: 20, opacity: 0, duration: 1, ease: 'power2.out', delay: 0.7 });
        gsap.from('.hero a', { scale: 0, opacity: 0, duration: 0.8, ease: 'back.out(1.7)', delay: 0.9 });
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    lenis.on('scroll', (e) => {
        const currentScroll = e.animatedScroll;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (currentScroll > lastScroll && currentScroll > 200) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
        lastScroll = currentScroll;
    });

    // Smooth Scroll for Nav Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                lenis.scrollTo(target, { duration: 1.5, offset: -50 });
            }
        });
    });

    // Render Portfolio Grid
    const portfolioGrid = document.getElementById('portfolio-grid');
    
    // Cloudinary Embed URL Parser (converts iframe URLs to raw mp4)
    function parseVideoUrl(url) {
        if (!url) return '';
        try {
            if (url.includes('player.cloudinary.com/embed')) {
                const urlObj = new URL(url);
                const cloudName = urlObj.searchParams.get('cloud_name');
                const publicId = urlObj.searchParams.get('public_id');
                if (cloudName && publicId) {
                    return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`;
                }
            }
        } catch(e) {}
        return url;
    }
    
    // Lazy Load Observer for Videos
    const lazyVideoObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target;
                if (video.dataset.src) {
                    video.src = video.dataset.src;
                    video.removeAttribute('data-src');
                }
                observer.unobserve(video);
            }
        });
    }, { rootMargin: "100px 0px" });
    
    function renderPortfolio(category = 'all') {
        portfolioGrid.innerHTML = '';
        const filteredData = category === 'all' 
            ? PORTFOLIO_DATA 
            : PORTFOLIO_DATA.filter(item => item.category === category);
            
        filteredData.forEach((item, index) => {
            const parsedVideoSrc = parseVideoUrl(item.videoSrc);
            // Random time for thumbnail to avoid starting blank frames
            const randomTime = (Math.random() * 3 + 2).toFixed(1); 
            
            // Create a preview using the video file
            const card = document.createElement('div');
            card.className = 'project-card';
            card.dataset.id = item.id;
            card.innerHTML = `
                <video class="project-video-preview lazy-video" data-src="${parsedVideoSrc}#t=${randomTime}" muted loop playsinline preload="metadata"></video>
                <div class="project-overlay">
                    <span class="project-category">${item.category}</span>
                    <h3 class="project-title">${item.title}</h3>
                    <div class="project-meta">
                        <span>${item.duration}</span>
                        <span>${item.software}</span>
                    </div>
                </div>
                <div class="play-indicator"><i data-lucide="play" style="color:white; width:24px; height:24px;"></i></div>
            `;
            portfolioGrid.appendChild(card);
            
            // Re-init lucide icons for new elements
            lucide.createIcons();

            // Setup lazy loading
            const videoPreview = card.querySelector('video');
            lazyVideoObserver.observe(videoPreview);

            // Hover to play preview logic
            card.addEventListener('mouseenter', () => videoPreview.play().catch(e => {}));
            card.addEventListener('mouseleave', () => {
                videoPreview.pause();
                videoPreview.currentTime = randomTime; // Reset to random thumbnail frame
            });

            // Click to open modal
            card.addEventListener('click', () => openVideoModal(item.id, card));
            
            // GSAP Stagger animation
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top bottom-=100'
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                delay: index * 0.1
            });
        });
    }

    renderPortfolio();

    // Portfolio Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPortfolio(btn.dataset.filter);
        });
    });

    // Custom Video Player Modal Logic
    const modal = document.getElementById('video-modal');
    const customPlayer = document.getElementById('custom-player');
    const closeModalBtn = document.querySelector('.close-modal');
    const playPauseBtn = document.getElementById('play-pause');
    const progressWrapper = document.querySelector('.progress-wrapper');
    const progressFilled = document.querySelector('.progress-filled');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const muteBtn = document.getElementById('mute-unmute');
    const volumeSlider = document.getElementById('volume-slider');
    const speedSelect = document.getElementById('playback-speed');
    const pipBtn = document.getElementById('pip-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    let currentProjectId = null;

    function formatTime(seconds) {
        if(isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' + s : s}`;
    }

    function updateModalContent(item) {
        customPlayer.src = parseVideoUrl(item.videoSrc);
        document.getElementById('modal-title').textContent = item.title;
        document.getElementById('modal-category').textContent = item.category;
        document.getElementById('modal-desc').textContent = item.description;
        document.getElementById('modal-software').innerHTML = `<i data-lucide="cpu"></i> ${item.software}`;
        lucide.createIcons();
    }

    function openVideoModal(id, sourceCard) {
        currentProjectId = id;
        const item = PORTFOLIO_DATA.find(i => i.id === id);
        if (!item) return;
        
        updateModalContent(item);
        
        // Prep modal state
        modal.style.opacity = 1;
        modal.style.pointerEvents = 'all';
        modal.classList.add('active'); // Just for internal state logic now
        lenis.stop(); // Stop background scrolling
        
        const modalContent = document.querySelector('.modal-content');
        const modalBg = document.querySelector('.modal-bg');
        const modalInfo = document.querySelector('.modal-info');
        const customControls = document.querySelector('.custom-controls');
        
        // Clear previous gsap properties
        gsap.set([modalContent, modalBg, modalInfo, customControls, closeModalBtn], { clearProps: "all" });
        
        if (sourceCard) {
            // Get source and target positions for FLIP animation
            const sourceRect = sourceCard.getBoundingClientRect();
            const targetRect = modalContent.getBoundingClientRect();
            
            const deltaX = sourceRect.left - targetRect.left;
            const deltaY = sourceRect.top - targetRect.top;
            const scaleX = sourceRect.width / targetRect.width;
            const scaleY = sourceRect.height / targetRect.height;
            
            // Animate Background
            gsap.fromTo(modalBg, 
                { opacity: 0 }, 
                { opacity: 1, duration: 0.5, ease: 'power3.inOut' }
            );
            
            // Morph the modal container from the thumbnail's bounding box
            gsap.fromTo(modalContent,
                {
                    x: deltaX,
                    y: deltaY,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    borderRadius: '12px',
                    transformOrigin: 'top left'
                },
                {
                    x: 0,
                    y: 0,
                    scaleX: 1,
                    scaleY: 1,
                    borderRadius: '12px',
                    duration: 0.7,
                    ease: 'expo.inOut',
                    onComplete: () => {
                        gsap.set(modalContent, { clearProps: "transformOrigin" });
                    }
                }
            );
            
            // Fade in controls and info after morph
            gsap.fromTo([modalInfo, customControls, closeModalBtn], 
                { opacity: 0, y: 20 }, 
                { opacity: 1, y: 0, duration: 0.4, delay: 0.5, ease: 'power2.out' }
            );
        } else {
            // Fallback if no source card
            gsap.fromTo(modalContent, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 });
        }
        
        // Autoplay
        customPlayer.play().then(() => {
            playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
            lucide.createIcons();
        });
    }

    function closeVideoModal() {
        const sourceCard = document.querySelector(`.project-card[data-id="${currentProjectId}"]`);
        const modalContent = document.querySelector('.modal-content');
        const modalBg = document.querySelector('.modal-bg');
        const modalInfo = document.querySelector('.modal-info');
        const customControls = document.querySelector('.custom-controls');
        
        customPlayer.pause();
        
        if (sourceCard) {
            const sourceRect = sourceCard.getBoundingClientRect();
            const targetRect = modalContent.getBoundingClientRect();
            
            const deltaX = sourceRect.left - targetRect.left;
            const deltaY = sourceRect.top - targetRect.top;
            const scaleX = sourceRect.width / targetRect.width;
            const scaleY = sourceRect.height / targetRect.height;
            
            // Fade out controls first
            gsap.to([modalInfo, customControls, closeModalBtn], { opacity: 0, duration: 0.2 });
            gsap.to(modalBg, { opacity: 0, duration: 0.6, ease: 'expo.inOut' });
            
            // Morph back into the thumbnail
            gsap.to(modalContent, {
                x: deltaX,
                y: deltaY,
                scaleX: scaleX,
                scaleY: scaleY,
                transformOrigin: 'top left',
                duration: 0.6,
                ease: 'expo.inOut',
                onComplete: () => {
                    modal.classList.remove('active');
                    modal.style.opacity = 0;
                    modal.style.pointerEvents = 'none';
                    gsap.set([modalContent, modalBg, modalInfo, customControls, closeModalBtn], { clearProps: "all" });
                    lenis.start();
                }
            });
        } else {
            modal.classList.remove('active');
            modal.style.opacity = 0;
            modal.style.pointerEvents = 'none';
            lenis.start();
        }
    }

    closeModalBtn.addEventListener('click', closeVideoModal);

    // Player Controls
    playPauseBtn.addEventListener('click', () => {
        if (customPlayer.paused) {
            customPlayer.play();
            playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
        } else {
            customPlayer.pause();
            playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
        }
        lucide.createIcons();
    });

    customPlayer.addEventListener('timeupdate', () => {
        const percent = (customPlayer.currentTime / customPlayer.duration) * 100;
        progressFilled.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(customPlayer.currentTime);
    });

    customPlayer.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(customPlayer.duration);
    });

    progressWrapper.addEventListener('click', (e) => {
        const rect = progressWrapper.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        customPlayer.currentTime = pos * customPlayer.duration;
    });

    muteBtn.addEventListener('click', () => {
        customPlayer.muted = !customPlayer.muted;
        if (customPlayer.muted || customPlayer.volume === 0) {
            muteBtn.innerHTML = '<i data-lucide="volume-x"></i>';
            volumeSlider.value = 0;
        } else {
            muteBtn.innerHTML = '<i data-lucide="volume-2"></i>';
            volumeSlider.value = customPlayer.volume;
        }
        lucide.createIcons();
    });

    volumeSlider.addEventListener('input', (e) => {
        customPlayer.volume = e.target.value;
        customPlayer.muted = e.target.value === '0';
        muteBtn.innerHTML = customPlayer.muted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
        lucide.createIcons();
    });

    speedSelect.addEventListener('change', (e) => {
        customPlayer.playbackRate = parseFloat(e.target.value);
    });

    fullscreenBtn.addEventListener('click', () => {
        if (customPlayer.requestFullscreen) {
            customPlayer.requestFullscreen();
        } else if (customPlayer.webkitRequestFullscreen) {
            customPlayer.webkitRequestFullscreen();
        }
    });

    if ('pictureInPictureEnabled' in document) {
        pipBtn.addEventListener('click', async () => {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await customPlayer.requestPictureInPicture();
                }
            } catch (err) {
                console.error(err);
            }
        });
    } else {
        pipBtn.style.display = 'none';
    }

    // Prev/Next Project Navigation
    document.getElementById('prev-project').addEventListener('click', () => {
        const idx = PORTFOLIO_DATA.findIndex(i => i.id === currentProjectId);
        if (idx > 0) {
            openVideoModal(PORTFOLIO_DATA[idx - 1].id);
        } else {
            openVideoModal(PORTFOLIO_DATA[PORTFOLIO_DATA.length - 1].id);
        }
    });

    document.getElementById('next-project').addEventListener('click', () => {
        const idx = PORTFOLIO_DATA.findIndex(i => i.id === currentProjectId);
        if (idx < PORTFOLIO_DATA.length - 1) {
            openVideoModal(PORTFOLIO_DATA[idx + 1].id);
        } else {
            openVideoModal(PORTFOLIO_DATA[0].id);
        }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        
        switch(e.key.toLowerCase()) {
            case 'escape':
                closeVideoModal();
                break;
            case ' ':
                e.preventDefault();
                playPauseBtn.click();
                break;
            case 'f':
                fullscreenBtn.click();
                break;
            case 'm':
                muteBtn.click();
                break;
        }
    });

    // Scroll Animations (GSAP)
    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach(sec => {
        gsap.from(sec.children, {
            scrollTrigger: {
                trigger: sec,
                start: 'top 80%',
            },
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out'
        });
    });

    // Counters Animation
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        gsap.to(counter, {
            scrollTrigger: {
                trigger: '.stats',
                start: 'top 85%'
            },
            innerHTML: counter.dataset.target,
            duration: 2,
            snap: { innerHTML: 1 },
            ease: 'power2.out'
        });
    });

    // Skill Bars Animation
    const fills = document.querySelectorAll('.progress-fill');
    fills.forEach(fill => {
        gsap.to(fill, {
            scrollTrigger: {
                trigger: '.skills',
                start: 'top 85%'
            },
            width: fill.dataset.width,
            duration: 1.5,
            ease: 'power3.out'
        });
    });

    // Marquee Animation
    gsap.to('.marquee', {
        xPercent: -50,
        ease: "none",
        duration: 20,
        repeat: -1
    });

    // Back to top
    document.getElementById('back-to-top').addEventListener('click', () => {
        lenis.scrollTo(0, { duration: 1.5 });
    });

});
