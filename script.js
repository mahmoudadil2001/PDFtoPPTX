document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.querySelector('.gallery-grid');
    const floatingContainer = document.querySelector('.floating-container');
    const chaosBtn = document.querySelector('#chaos-mode');
    const funnyMsg = document.querySelector('#funny-msg');
    const headTracker = document.querySelector('#head-tracker');
    
    const images = [
        'aliazhar/1 (1).jpg', 'aliazhar/1 (2).jpg', 'aliazhar/1 (3).jpg',
        'aliazhar/1 (4).jpg', 'aliazhar/1 (5).jpg', 'aliazhar/1 (6).jpg',
        'aliazhar/1 (7).jpg'
    ];

    const captions = [
        "نغولة ستايل 😎", "علي وهو يسوي روحه عاقل 😇", "الوجه الثاني للأسطورة 👹",
        "وضع الدفاع المستميت 😂", "هنا كان ناوي على شر 😈", "مود الروقان والونسة ✨",
        "أخطر لقطة في التاريخ 📸"
    ];

    const msgs = [
        "دلي الأزرار.. علي أزهر في الانتظار!", "عبالك تخلص منه؟ هيهات!",
        "النغولة تجري بدمه 💉", "يا ولد.. علي أزهر وصل!", "احذر.. الابتسامة معدية!"
    ];

    // 1. Cursor & Head Tracker
    const cursor = document.querySelector('.cursor-glow');
    let mouseX = 0, mouseY = 0;
    let headX = 0, headY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
        if (window.innerWidth > 768) headTracker.style.display = 'block';
    });

    function animateHead() {
        headX += (mouseX - headX) * 0.1;
        headY += (mouseY - headY) * 0.1;
        headTracker.style.left = (headX + 20) + 'px';
        headTracker.style.top = (headY + 20) + 'px';
        requestAnimationFrame(animateHead);
    }
    animateHead();

    // 2. Populate Gallery & Tilt
    images.forEach((src, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${src}" alt="Ali Azhar ${index + 1}" style="transition: transform 0.1s ease-out">
            <div class="img-caption">${captions[index] || "نغولة لا تنتهي"}</div>
        `;
        
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * -30;
            item.querySelector('img').style.transform = `rotateX(${y}deg) rotateY(${x}deg) scale(1.1)`;
        });
        
        item.addEventListener('mouseleave', () => {
            item.querySelector('img').style.transform = '';
        });

        galleryGrid.appendChild(item);

        if (index < 4) {
            const floatImg = document.createElement('img');
            floatImg.src = src;
            floatImg.className = 'floating-img';
            floatImg.style.cssText = `top:${Math.random()*80}%; left:${Math.random()*80}%; animation-delay:${Math.random()*5}s; width:${Math.random()*40+60}px; height:auto;`;
            floatingContainer.appendChild(floatImg);
        }
    });

    // 3. The Game Logic: Catch the Nghoula
    const gameBoard = document.querySelector('#game-board');
    const startBtn = document.querySelector('#start-game');
    const scoreEl = document.querySelector('#score');
    const highScoreEl = document.querySelector('#high-score');
    const timerEl = document.querySelector('#timer');
    
    let score = 0;
    let timeLeft = 30;
    let gameActive = false;
    let highScore = localStorage.getItem('aliHighScore') || 0;
    highScoreEl.innerText = highScore;

    function spawnFace() {
        if (!gameActive) return;
        
        const existing = document.querySelector('.target-face');
        if (existing) existing.remove();

        const face = document.createElement('img');
        face.src = images[Math.floor(Math.random() * images.length)];
        face.className = 'target-face';
        
        const maxX = gameBoard.clientWidth - 80;
        const maxY = gameBoard.clientHeight - 80;
        
        face.style.left = Math.random() * maxX + 'px';
        face.style.top = Math.random() * maxY + 'px';
        
        face.addEventListener('click', () => {
            score++;
            scoreEl.innerText = score;
            face.src = 'https://cdn-icons-png.flaticon.com/512/1791/1791330.png'; // Explosion or hit icon
            setTimeout(spawnFace, 100);
        });

        gameBoard.appendChild(face);

        // Face disappears if not clicked fast enough
        const speed = Math.max(400, 1000 - (score * 20));
        setTimeout(() => {
            if (face.parentElement === gameBoard) spawnFace();
        }, speed);
    }

    startBtn.addEventListener('click', () => {
        score = 0;
        timeLeft = 30;
        gameActive = true;
        scoreEl.innerText = score;
        timerEl.innerText = timeLeft;
        document.querySelector('#start-screen').style.display = 'none';
        
        const timer = setInterval(() => {
            timeLeft--;
            timerEl.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timer);
                endGame();
            }
        }, 1000);
        
        spawnFace();
    });

    function endGame() {
        gameActive = false;
        document.querySelector('#start-screen').style.display = 'flex';
        document.querySelector('#start-screen h3')?.remove();
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('aliHighScore', highScore);
            highScoreEl.innerText = highScore;
            alert(`كفوووو! كسر الرقم القياسي الجديد: ${score}`);
        } else {
            alert(`خلص الوقت! نقاطك: ${score}`);
        }
    }

    // 4. Chaos Mode
    chaosBtn.addEventListener('mousemove', () => {
        if (Math.random() > 0.4) {
            chaosBtn.style.left = (Math.random() - 0.5) * 200 + 'px';
            chaosBtn.style.top = (Math.random() - 0.5) * 100 + 'px';
        }
    });

    chaosBtn.addEventListener('click', () => {
        document.body.style.filter = `invert(${Math.random() > 0.5 ? 1 : 0}) hue-rotate(${Math.random()*360}deg)`;
        funnyMsg.innerText = msgs[Math.floor(Math.random() * msgs.length)];
        document.querySelectorAll('.gallery-item').forEach(i => i.style.transform = `scale(${Math.random()+0.5}) rotate(${Math.random()*360}deg)`);
        setTimeout(() => {
            document.body.style.filter = '';
            document.querySelectorAll('.gallery-item').forEach(i => i.style.transform = '');
        }, 2000);
    });

    // Mood & Scroll
    document.querySelector('#change-mood').addEventListener('click', (e) => {
        e.preventDefault();
        const colors = [['#ff007a', '#00ecff'], ['#00ff88', '#ffcc00'], ['#7000ff', '#ff00ff']];
        const random = colors[Math.floor(Math.random() * colors.length)];
        document.documentElement.style.setProperty('--primary', random[0]);
        document.documentElement.style.setProperty('--secondary', random[1]);
    });
});
