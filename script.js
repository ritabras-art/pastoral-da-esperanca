// ===== STATE =====
var state = {
    currentModule: 'home',
    completedModules: JSON.parse(localStorage.getItem('pe_completed') || '[]')
};

var modules = ['modulo1','modulo2','modulo3','modulo4','modulo5','modulo6','modulo7','modulo8','modulo9','modulo10'];

// ===== NAVIGATION =====
function navigateTo(moduleId) {
    document.querySelectorAll('.module').forEach(function(m) { m.classList.add('hidden'); });

    var target = document.getElementById(moduleId);
    if (target) {
        target.classList.remove('hidden');
        state.currentModule = moduleId;

        document.querySelectorAll('.nav-link').forEach(function(link) {
            link.classList.remove('active');
            if (link.dataset.module === moduleId) {
                link.classList.add('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeSidebar();
        setTimeout(initAudioPlayers, 100);
        updateToggleButtons();
    }
}

function toggleModule(moduleId) {
    var idx = state.completedModules.indexOf(moduleId);

    if (idx === -1) {
        state.completedModules.push(moduleId);
        localStorage.setItem('pe_completed', JSON.stringify(state.completedModules));
        updateProgress();
        updateToggleButtons();

        var modIdx = modules.indexOf(moduleId);
        if (modIdx < modules.length - 1) {
            navigateTo(modules[modIdx + 1]);
        } else {
            navigateTo('quiz');
        }
    } else {
        state.completedModules.splice(idx, 1);
        localStorage.setItem('pe_completed', JSON.stringify(state.completedModules));
        updateProgress();
        updateToggleButtons();
    }
}

function updateToggleButtons() {
    modules.forEach(function(mod) {
        var btn = document.getElementById('toggleBtn-' + mod);
        if (!btn) return;
        if (state.completedModules.includes(mod)) {
            btn.textContent = '↩ Desmarcar Módulo';
            btn.classList.remove('btn-complete');
            btn.classList.add('btn-uncomplete');
        } else {
            btn.textContent = '✓ Concluir Módulo';
            btn.classList.remove('btn-uncomplete');
            btn.classList.add('btn-complete');
        }
    });
}

function updateProgress() {
    var total = modules.length;
    var completed = state.completedModules.length;
    var pct = Math.round((completed / total) * 100);

    var fill = document.getElementById('globalProgress');
    var text = document.getElementById('progressText');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = pct + '% concluido (' + completed + '/' + total + ')';

    document.querySelectorAll('.nav-link').forEach(function(link) {
        var mod = link.dataset.module;
        if (state.completedModules.includes(mod)) {
            link.classList.add('completed');
        } else {
            link.classList.remove('completed');
        }
    });
}

// ===== SIDEBAR =====
function closeSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    // Menu toggle
    var menuBtn = document.querySelector('.menu-toggle');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('overlay');

    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Nav links
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo(link.dataset.module);
        });
    });

    // Accordion
    document.querySelectorAll('.accordion-header').forEach(function(header) {
        header.addEventListener('click', function() {
            var item = header.parentElement;
            var isOpen = item.classList.contains('open');
            item.parentElement.querySelectorAll('.accordion-item').forEach(function(i) { i.classList.remove('open'); });
            if (!isOpen) item.classList.add('open');
        });
    });

    // Init
    updateProgress();
    updateToggleButtons();
    initAudioPlayers();
});

// ===== AUDIO PLAYER =====
var audioPlayers = {};

function initAudioPlayers() {
    document.querySelectorAll('.audio-player-container').forEach(function(container) {
        var audioId = container.dataset.audioId;
        var audioSrc = container.dataset.audioSrc;

        if (audioPlayers[audioId]) return;

        var audio = new Audio();
        audio.preload = 'none';
        audio.setAttribute('playsinline', '');
        audio.setAttribute('webkit-playsinline', '');
        audio.src = audioSrc;

        var playBtn = container.querySelector('.audio-play-btn');
        var progressBar = container.querySelector('.audio-progress-bar');
        var progressFill = container.querySelector('.audio-progress-fill');
        var timeDisplay = container.querySelector('.audio-time');
        var speedBtns = container.querySelectorAll('.speed-btn');

        audioPlayers[audioId] = { audio: audio, container: container };

        function formatTime(s) {
            if (!s || isNaN(s)) return '0:00';
            var m = Math.floor(s / 60);
            var sec = Math.floor(s % 60);
            return m + ':' + (sec < 10 ? '0' : '') + sec;
        }

        // Loading state
        var isLoading = false;

        audio.addEventListener('waiting', function() {
            isLoading = true;
            playBtn.textContent = '⏳';
        });

        audio.addEventListener('playing', function() {
            isLoading = false;
            playBtn.textContent = '⏸';
        });

        audio.addEventListener('canplay', function() {
            if (isLoading) {
                isLoading = false;
                playBtn.textContent = audio.paused ? '▶' : '⏸';
            }
        });

        // Play/Pause
        playBtn.addEventListener('click', function() {
            Object.keys(audioPlayers).forEach(function(id) {
                if (id !== audioId && !audioPlayers[id].audio.paused) {
                    audioPlayers[id].audio.pause();
                    audioPlayers[id].container.querySelector('.audio-play-btn').textContent = '▶';
                }
            });

            if (audio.paused) {
                playBtn.textContent = '⏳';
                var playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(function() {
                        playBtn.textContent = '⏸';
                    }).catch(function(err) {
                        playBtn.textContent = '▶';
                    });
                }
            } else {
                audio.pause();
                playBtn.textContent = '▶';
            }
        });

        // Time update
        audio.addEventListener('timeupdate', function() {
            if (audio.duration && !isNaN(audio.duration)) {
                var pct = (audio.currentTime / audio.duration) * 100;
                progressFill.style.width = pct + '%';
                timeDisplay.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
            }
        });

        // Show duration when metadata loads
        audio.addEventListener('loadedmetadata', function() {
            if (audio.duration && !isNaN(audio.duration)) {
                timeDisplay.textContent = '0:00 / ' + formatTime(audio.duration);
            }
        });

        // Click/touch on progress bar to seek
        function handleSeek(e) {
            if (audio.duration && !isNaN(audio.duration)) {
                var rect = progressBar.getBoundingClientRect();
                var clientX = e.touches ? e.touches[0].clientX : e.clientX;
                var x = clientX - rect.left;
                var pct = Math.max(0, Math.min(1, x / rect.width));
                audio.currentTime = pct * audio.duration;
            }
        }
        progressBar.addEventListener('click', handleSeek);
        progressBar.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleSeek(e);
        }, { passive: false });

        // Speed buttons
        speedBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var speed = parseFloat(btn.dataset.speed);
                audio.playbackRate = speed;
                container.querySelectorAll('.speed-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
            });
        });

        // When audio ends
        audio.addEventListener('ended', function() {
            playBtn.textContent = '▶';
        });

        // Save audio position to localStorage every 10 seconds
        var saveInterval = null;
        audio.addEventListener('play', function() {
            saveInterval = setInterval(function() {
                localStorage.setItem('pe_audio_' + audioId, audio.currentTime);
            }, 10000);
        });
        audio.addEventListener('pause', function() {
            clearInterval(saveInterval);
            localStorage.setItem('pe_audio_' + audioId, audio.currentTime);
        });

        // Load saved audio position from localStorage
        var savedTime = parseFloat(localStorage.getItem('pe_audio_' + audioId));
        if (savedTime > 0) {
            audio.addEventListener('loadedmetadata', function() {
                audio.currentTime = savedTime;
            }, { once: true });
        }
    });
}
