/*!
 * SOLIDWORKS Visualize (Pre)Viewer - Enhanced
 * 
 * Basic logic supporting this page.
 * This does **not** need to be included when embedding into another site
 */

(function Viewer() {
    const viewer = document.querySelector('#viewer');
    const viewerParent = viewer.parentElement;
    const loadingOverlay = document.getElementById('loading-overlay');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const hintOverlay = document.getElementById('hint-overlay');

    const btnActual = document.getElementById('btn-actual');
    const btnFit = document.getElementById('btn-fit');
    const btnAutoplay = document.getElementById('btn-autoplay');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    // By default, the viewer is "fit to screen"
    let shouldFitOnResize = true;
    let isAutoPlaying = false;
    let vrInstance = null;
    let totalFrames = 180;
    let progressInterval = null;

    btnFit.classList.add('hidden');

    // Wait for VR instance to be created
    function waitForVR() {
        if (window.threeSixty && threeSixty._vr) {
            vrInstance = threeSixty._vr;
            totalFrames = (vrInstance.totalFrames[0] || 1) * (vrInstance.totalFrames[1] || 1);
            startProgressTracking();
        } else {
            setTimeout(waitForVR, 50);
        }
    }
    waitForVR();

    // Poll for loaded frames progress
    function startProgressTracking() {
        updateProgress();
        progressInterval = setInterval(updateProgress, 200);
    }

    function countLoadedFrames() {
        if (!vrInstance || !vrInstance.frames) return 0;
        let count = 0;
        for (let i = 0; i < vrInstance.frames.length; i++) {
            const row = vrInstance.frames[i];
            if (!row) continue;
            for (let j = 0; j < row.length; j++) {
                // loaded frames are Image elements; loading-in-progress is `true`
                if (row[j] && row[j] !== true && typeof row[j].nodeType !== 'undefined') {
                    count++;
                }
            }
        }
        return count;
    }

    function updateProgress() {
        const loaded = countLoadedFrames();
        const percent = Math.min(100, Math.round((loaded / totalFrames) * 100));
        
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
        if (progressText) {
            progressText.textContent = loaded + ' / ' + totalFrames;
        }
        
        // Hide loading overlay once we have enough frames for interaction
        // (intro needs just a few; we wait for ~15% or at least 12 frames)
        const threshold = Math.max(12, Math.floor(totalFrames * 0.15));
        if (loaded >= threshold) {
            if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
                loadingOverlay.classList.add('hidden');
                showHint();
            }
        }
        
        // Stop polling when all frames are loaded
        if (loaded >= totalFrames && progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    function showHint() {
        if (!hintOverlay) return;
        hintOverlay.classList.remove('hidden');
        setTimeout(() => {
            if (hintOverlay && !hintOverlay.classList.contains('hidden')) {
                hintOverlay.classList.add('hidden');
            }
        }, 4000);
    }

    // Handle Button Events

    btnActual.addEventListener('click', function () {
        const img = document.querySelector('#viewer img');
        if (!img) return;
        
        var actualWidth = img.naturalWidth;
        var actualHeight = img.naturalHeight;

        viewer.style.width = `${actualWidth}px`;
        viewer.style.height = `${actualHeight}px`;

        shouldFitOnResize = false;
        viewer.style.resize = 'both';

        btnActual.classList.add('hidden');
        btnFit.classList.remove('hidden');
    });

    btnFit.addEventListener('click', function () {
        FitToScreen();
        shouldFitOnResize = true;
        viewer.style.resize = 'none';
        btnFit.classList.add('hidden');
        btnActual.classList.remove('hidden');
    });

    // Auto-play toggle
    btnAutoplay.addEventListener('click', function () {
        if (!vrInstance) return;
        
        if (isAutoPlaying) {
            vrInstance.pause();
            isAutoPlaying = false;
            btnAutoplay.classList.remove('active');
            btnAutoplay.title = '自动旋转';
        } else {
            vrInstance.play();
            isAutoPlaying = true;
            btnAutoplay.classList.add('active');
            btnAutoplay.title = '停止旋转';
        }
    });

    // Fullscreen toggle
    btnFullscreen.addEventListener('click', function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', function () {
        if (document.fullscreenElement) {
            btnFullscreen.classList.add('active');
            btnFullscreen.title = '退出全屏';
        } else {
            btnFullscreen.classList.remove('active');
            btnFullscreen.title = '全屏';
        }
        // Re-fit after fullscreen transition
        setTimeout(() => {
            if (shouldFitOnResize) {
                FitToScreen();
            }
        }, 100);
    });

    function FitToScreen() {
        var parentWidth = viewerParent.clientWidth;
        var parentHeight = viewerParent.clientHeight;
        
        viewer.style.width = `${parentWidth}px`;
        viewer.style.height = `${parentHeight}px`;
    }

    // Handle Window Resize
    var viewerResizeObserver = new ResizeObserver(function (entries) {
        if (!shouldFitOnResize) { return; }
        if (entries.length === 0 || !entries[0].contentRect || entries[0].contentRect.height == 0) { return; }

        FitToScreen();
    });

    viewerResizeObserver.observe(viewerParent);

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        // Space: toggle autoplay
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            btnAutoplay.click();
        }
        // F: toggle fullscreen
        if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            btnFullscreen.click();
        }
    });

    // Hide hint on first interaction
    function hideHintOnInteraction() {
        if (hintOverlay) {
            hintOverlay.classList.add('hidden');
        }
        viewer.removeEventListener('mousedown', hideHintOnInteraction);
        viewer.removeEventListener('touchstart', hideHintOnInteraction);
    }
    viewer.addEventListener('mousedown', hideHintOnInteraction);
    viewer.addEventListener('touchstart', hideHintOnInteraction);

})();
