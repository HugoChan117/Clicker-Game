(function(){
    const overlay=document.getElementById('overlay');
    const loadEmojiSpan=document.getElementById('loadEmoji');
    let isTransitioning=false;
    let audioCtx=null;
    let soundEnabled=false;
    function initAudio(){
        if(audioCtx)return;
        try{
            audioCtx=new (window.AudioContext||window.webkitAudioContext)();
            soundEnabled=true;
        }catch(e){soundEnabled=false;}
    }
function playClickSound(){
    if(!soundEnabled||!audioCtx)return;
    try{
        const now=audioCtx.currentTime;
        const osc1=audioCtx.createOscillator();
        const gain1=audioCtx.createGain();
        osc1.type='sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.12);
        const osc2=audioCtx.createOscillator();
        const gain2=audioCtx.createGain();
        osc2.type='triangle';
        osc2.frequency.setValueAtTime(1320, now);
        gain2.gain.setValueAtTime(0.07, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now);
        osc2.stop(now + 0.08);
        const bufferSize=audioCtx.sampleRate * 0.03; // 30 ms
        const noiseBuffer=audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        let output=noiseBuffer.getChannelData(0);
        for(let i=0;i<bufferSize;i++){
            output[i]=Math.random()*2 -1;
        }
        const noise=audioCtx.createBufferSource();
        noise.buffer=noiseBuffer;
        const noiseGain=audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start(now);
        noise.stop(now + 0.03);

    }catch(e){}
}
    const style=document.createElement('style');
    style.textContent=`.game-btn{display:flex;align-items:center;justify-content:center;transition:border-radius 0.1s,transform 0.18s cubic-bezier(0.18,0.89,0.32,1.28),box-shadow 0.18s;}.btn-emoji{display:inline-flex;align-items:center;justify-content:center;transition:font-size 0.08s,transform 0.18s;}`;
    document.head.appendChild(style);
    const btns=Array.from(document.querySelectorAll('.game-btn'));
    const emojiMap=new Map();
    function updateSize(btn,span){
        if(!btn||!span)return;
        const w=btn.clientWidth;
        if(w<=0)return;
        let fs=Math.min(92,Math.max(32,w*0.48));
        span.style.fontSize=fs+'px';
        span.style.lineHeight='1';
        let h=btn.clientHeight;
        if(h>0)btn.style.borderRadius=Math.min(h/2.8,42)+'px';
    }
    function refresh(btn,span){updateSize(btn,span);}
    btns.forEach(btn=>{
        let span=btn.querySelector('.btn-emoji');
        if(span){
            emojiMap.set(btn,span);
            if(window.ResizeObserver){
                let ro=new ResizeObserver(()=>{if(btn.isConnected)refresh(btn,span);});
                ro.observe(btn);
            }
            refresh(btn,span);
        }
    });
    window.addEventListener('resize',()=>{requestAnimationFrame(()=>{btns.forEach(b=>{let s=emojiMap.get(b);if(s&&b.isConnected)refresh(b,s);});});});
    setTimeout(()=>{btns.forEach(b=>{let s=emojiMap.get(b);if(s&&b.isConnected)refresh(b,s);});},100);
    document.body.addEventListener('touchstart',()=>{if(!audioCtx)initAudio();},{once:true,passive:true});
    document.body.addEventListener('click',()=>{if(!audioCtx)initAudio();},{once:true});
    
    // Function to check if URL is reachable
    async function isUrlReachable(url, timeout = 3000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // Modified navigation function with 404 fallback
    async function navigateToUrl(originalUrl, fallbackUrl, callback) {
        const isReachable = await isUrlReachable(originalUrl);
        const targetUrl = isReachable ? originalUrl : fallbackUrl;
        if (callback) callback(targetUrl, isReachable);
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 420);
    }
    
    // Reattach dynamic behaviors for each button (preserve all features, ensure clone handling & burst emoji)
    btns.forEach(oldBtn=>{
        const url=oldBtn.getAttribute('data-url');
        if(!url)return;
        const fallbackUrl = 'https://clicker-game.neineig2012.workers.dev/404';
        const themeEmoji=oldBtn.getAttribute('data-emoji')||'🍑';
        const newBtn=oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn,oldBtn);
        const newSpan=newBtn.querySelector('.btn-emoji');
        if(newSpan){
            const idx=btns.indexOf(oldBtn);
            if(idx!==-1)btns[idx]=newBtn;
            emojiMap.delete(oldBtn);
            emojiMap.set(newBtn,newSpan);
            refresh(newBtn,newSpan);
            if(window.ResizeObserver){
                let ro=new ResizeObserver(()=>{if(newBtn.isConnected)refresh(newBtn,newSpan);});
                ro.observe(newBtn);
            }
        }
        newBtn.addEventListener('click',(e)=>{
            e.preventDefault();
            e.stopPropagation();
            if(isTransitioning)return;
            if(!audioCtx)initAudio();
            playClickSound();
            isTransitioning=true;
            if(loadEmojiSpan)loadEmojiSpan.innerText=themeEmoji;
            if(overlay){
                overlay.classList.add('active');
                const container=overlay.querySelector('.loading-container');
                if(container){
                    container.style.animation='none';
                    container.offsetHeight;
                    container.style.animation='';
                }
            }

            newBtn.style.transform='translateY(5px) scale(0.96)';
            newBtn.style.boxShadow='0 3px 0 rgba(0,0,0,0.1)';
            setTimeout(()=>{if(newBtn){newBtn.style.transform='';newBtn.style.boxShadow='';}},120);
            const rect=newBtn.getBoundingClientRect();
            const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
            // burst particle effect using theme emoji
            for(let i=0;i<12;i++){
                let p=document.createElement('div');
                p.innerText=themeEmoji;
                p.style.position='fixed';
                p.style.left=cx+'px';
                p.style.top=cy+'px';
                p.style.fontSize='26px';
                p.style.pointerEvents='none';
                p.style.zIndex='10000';
                p.style.opacity='0.9';
                p.style.transform='translate(-50%,-50%)';
                p.style.transition='all 0.55s cubic-bezier(0.2,0.9,0.5,1.2)';
                document.body.appendChild(p);
                let ang=Math.random()*Math.PI*2;
                let dist=45+Math.random()*70;
                let dx=Math.cos(ang)*dist,dy=Math.sin(ang)*dist-20;
                requestAnimationFrame(()=>{
                    p.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
                    p.style.opacity='0';
                    p.style.fontSize=`${18+Math.random()*18}px`;
                });
                setTimeout(()=>p.remove(),600);
            }

            // Check URL reachability before navigating
            navigateToUrl(url, fallbackUrl, (targetUrl, isOriginalReachable) => {
                // If site wasn't found, show different emoji briefly?
                if(!isOriginalReachable && loadEmojiSpan) {
                    loadEmojiSpan.innerText = '⚠️';
                    setTimeout(() => {
                        if(loadEmojiSpan) loadEmojiSpan.innerText = themeEmoji;
                    }, 200);
                }
            });
            
            setTimeout(()=>{if(isTransitioning)window.location.href=fallbackUrl;},1000);
        });
        newBtn.setAttribute('role','button');
        newBtn.setAttribute('tabindex','0');
        newBtn.addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();newBtn.click();}});
    });
    const howto=document.querySelector('.howto');if(howto)howto.remove();
    const footers=document.querySelectorAll('.footer,.credit,.attribution');footers.forEach(f=>f.remove());
    window.addEventListener('pageshow',()=>{isTransitioning=false;if(overlay)overlay.classList.remove('active');});
    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{btns.forEach(b=>{let s=emojiMap.get(b);if(s&&b.isConnected)refresh(b,s);});},30);});
    }else{
        setTimeout(()=>{btns.forEach(b=>{let s=emojiMap.get(b);if(s&&b.isConnected)refresh(b,s);});},30);
    }
})();
