    document.addEventListener('DOMContentLoaded', () => {
  
    // 1) URL 쿼리에 선택값이 있으면 결과 페이지 모드
    const params = new URLSearchParams(location.search);
    const hasResultParams = ['place','mood','flow','extras'].every(k => params.has(k));
    if (hasResultParams || /result\.html$/i.test(location.pathname)) {
      renderResultFromParams(params);
      return;
    }
  
    // ------ 선택(스텝) 페이지 모드 ------
  
    // 2) 단계 정의 (카피/옵션)
    const steps = [
      {
        id: "place",
        title: "어디에서 음악을 만나고 싶나요?",
        hint: "당신의 오늘에 맞는 무대를 고르세요.",
        options: [
          { value:"field",  label:"들판",     color:"#CDE2A5" },
          { value:"forest", label:"숲속",     color:"#9CC59A" },
          { value:"lake",   label:"계곡",  color:"#A9D4E9" },
          { value:"sea",    label:"바닷가",   color:"#7EC2D9" },
        ]
      },
      {
        id: "mood",
        title: "어떤 결의 음악을 기대하나요?",
        hint: "클래식의 문법 속에서 오늘의 무드를 고르세요.",
        options: [
          { value:"classical",     label:"고전주의적",   color:"#EAE7E0" },
          { value:"romantic",      label:"낭만주의적",   color:"#E6C5CF" },
          { value:"impressionist", label:"인상주의적",   color:"#CFE0F2" },
          { value:"neoclassical",  label:"신고전주의적", color:"#D9D9D9" },
          { value:"avantgarde",    label:"전위적",       color:"#F3D14E" },
          { value:"minimal",       label:"미니멀리즘",   color:"#F0F0F0" }
        ]
      },
      {
        id: "flow",
        title: "몸과 시선은 어떻게 흐르면 좋을까요?",
        hint: "관람의 리듬을 정하면 공연이 더 가까워집니다.",
        options: [
          { value:"lie",     label:"누워서",           color:"#F6EBD9" },
          { value:"sit",     label:"앉아서",           color:"#E8E3FF" },
          { value:"walk",    label:"걸으면서",         color:"#E0F7F1" },
          { value:"scatter", label:"자유롭게 흩어져",   color:"#FFEAD6" },
          { value:"close",   label:"연주자 가까이서",   color:"#F4E6E6" },
          { value:"circle",  label:"원형으로 둘러앉아", color:"#E6F0FF" }
        ]
      },
      {
        id: "extras",
        title: "공연의 여운은 어떻게 이어질까요?",
        hint: "연주자와의 교류 혹은 페스티벌적 즐거움을 고르세요.",
        options: [
          { value:"talk",      label:"연주자와 대화", color:"#FDE3B5" },
          { value:"posttalk",  label:"포스트 토크",   color:"#F6D0E6" },
          { value:"tea",       label:"다과 시간",     color:"#E6F4D9" },
          { value:"instrument",label:"악기 체험",     color:"#DDEBFF" },
          { value:"drawing",   label:"드로잉 부스",   color:"#EAD9FF" },
          { value:"campfire",  label:"캠프파이어",    color:"#FFE1D6" }
        ]
      }
    ];
  
    // 3) 상태/요소
    let stepIndex = 0;
    const selections = {}; // { place, mood, flow, extras }
    const stepDots = document.getElementById('stepDots');
    const stepTitle = document.getElementById('stepTitle');
    const stepHint  = document.getElementById('stepHint');
    const radialContainer = document.getElementById('radialContainer');
    const btnPrev = document.getElementById('btnPrev');
  
    // 4) 초기화
    initProgressDots();
    renderStep();
  
    function initProgressDots() {
      if (!stepDots) return;
      stepDots.innerHTML = '';
      steps.forEach((_, i) => {
        const li = document.createElement('li');
        if (i === 0) li.classList.add('is-active');
        stepDots.appendChild(li);
      });
    }
  
    function renderStep() {
      const step = steps[stepIndex];
      stepTitle.textContent = step.title;
      stepHint.textContent  = step.hint;
      btnPrev.disabled = stepIndex === 0;
  
      radialContainer.innerHTML = '';
      radialContainer.appendChild(buildRadialSelectorFullPie(
        step.options,
        selections[step.id] || null,
        (val) => {
          selections[step.id] = val;
          if (stepIndex < steps.length - 1) {
            stepIndex++;
            renderStep();
          } else {
            // 마지막 선택 → 새 페이지로 이동
            goToResultPage(selections);
          }
        }
      ));
  
      if (stepDots) {
        [...stepDots.children].forEach((li, i) => {
          li.classList.toggle('is-active', i === stepIndex);
          li.classList.toggle('is-done', i < stepIndex);
        });
      }
    }
  
    btnPrev?.addEventListener('click', () => {
      if (stepIndex === 0) return;
      stepIndex--;
      renderStep();
    });
  
    // 5) 라디얼(꽉 찬 파이) — 그룹: fill(밝아짐) + stroke(점선) + label
    function buildRadialSelectorFullPie(options, selectedValue, onSelect) {
      // 안전한 사이즈 계산 (초기 width=0 대비)
      const rc = radialContainer.getBoundingClientRect();
      let baseW = rc.width;
      if (!baseW || baseW < 16) {
        const parentW = radialContainer.parentElement?.getBoundingClientRect()?.width || 0;
        baseW = parentW > 0 ? parentW : window.innerWidth;
      }
      const size = Math.min(baseW, 520);
  
      const rOuter = size / 2;
      const cx = rOuter, cy = rOuter;
      const n = options.length;
      const tau = Math.PI * 2;
      const gap = 0;
  
      const wrap = document.createElement('div');
      wrap.style.width = `${size}px`;
      wrap.style.height = `${size}px`;
      wrap.style.position = 'relative';
      wrap.style.margin = '0 auto';
  
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      svg.setAttribute('aria-hidden', 'false');
      wrap.appendChild(svg);
  
      // 분할선(얇게)
      const sepGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (let i = 0; i < n; i++) {
        const a = (i / n) * tau;
        const x = cx + rOuter * Math.cos(a);
        const y = cy + rOuter * Math.sin(a);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', cx);
        line.setAttribute('y1', cy);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y);
        line.setAttribute('class', 'sep-line');
        sepGroup.appendChild(line);
      }
      svg.appendChild(sepGroup);
  
      // 슬라이스들
      options.forEach((opt, i) => {
        const a0 = (i / n) * tau + gap / 2;
        const a1 = ((i + 1) / n) * tau - gap / 2;
        const d  = wedgePathPie(cx, cy, rOuter, a0, a1);
  
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'slice-group');
        if (opt.value === selectedValue) g.classList.add('is-selected');
  
        // 밝아지는 면 (screen blend) — CSS로 opacity 제어
        const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        fillPath.setAttribute('d', d);
        fillPath.setAttribute('class', 'slice-fill');
  
        // 흰 점선 테두리
        const strokePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        strokePath.setAttribute('d', d);
        strokePath.setAttribute('class', 'slice-stroke');
  
        // 라벨
        const mid = (a0 + a1) / 2;
        const lr  = rOuter * 0.6;
        const lx  = cx + Math.cos(mid) * lr;
        const ly  = cy + Math.sin(mid) * lr;
  
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', lx);
        label.setAttribute('y', ly);
        label.setAttribute('fill', '#fff');
        label.setAttribute('font-size', Math.max(12, rOuter * 0.065));
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.style.pointerEvents = 'none';
        label.textContent = opt.label;
  
        // 클릭: 그룹 전체
        g.addEventListener('click', () => {
          svg.querySelectorAll('.slice-group').forEach(sg => sg.classList.remove('is-selected'));
          g.classList.add('is-selected');
          onSelect(opt.value);
        }, { passive: true });
  
        g.appendChild(fillPath);
        g.appendChild(strokePath);
        g.appendChild(label);
        svg.appendChild(g);
      });
  
      return wrap;
    }
  
    function wedgePathPie(cx, cy, r, a0, a1) {
      const sx = cx + r * Math.cos(a0);
      const sy = cy + r * Math.sin(a0);
      const ex = cx + r * Math.cos(a1);
      const ey = cy + r * Math.sin(a1);
      const large = (a1 - a0) % (Math.PI*2) > Math.PI ? 1 : 0;
      return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
    }
  
    // 마지막 선택 후: result.html 로 이동
    function goToResultPage(sel) {
      const url = new URL('result.html', location.href);
      Object.entries(sel).forEach(([k, v]) => url.searchParams.set(k, v));
      location.href = url.toString();
    }
  });
  
  /* ============ 공통 (선택/결과 둘 다 사용) ============ */
  
  // 팔레트
  const moodPalettes = {
    classical:     ['#FBFBFB','#DADADA','#8F8F8F','#1E1E1E'],
    romantic:      ['#2B1D2A','#6E2F4F','#C14972','#F2C6C2'],
    impressionist: ['#E4F1F9','#B7D3E9','#8BBAD8','#4A6FA5'],
    neoclassical:  ['#FFFFFF','#D9D9D9','#9E9E9E','#222222'],
    avantgarde:    ['#0D0D0D','#FFFFFF','#FF4D4D','#1AE5BE'],
    minimal:       ['#FFFFFF','#EFEFEF','#D9D9D9','#111111']
  };
  
  // 결과 페이지 렌더
  function renderResultFromParams(params) {
    ensureGlobalOverlay(); // 결과 페이지에도 오버레이 유지
  
    let mount = document.getElementById('resultMount');
    if (!mount) {
      mount = document.createElement('main');
      mount.id = 'resultMount';
      mount.className = 'app'; // UI 레이어(z-index:2) 적용
      mount.style.maxWidth = '960px';
      mount.style.margin = '0 auto';
      mount.style.padding = '16px';
      document.body.appendChild(mount);
    }
  
    const sel = {
      place: params.get('place') || '',
      mood: params.get('mood') || 'classical',
      flow: params.get('flow') || '',
      extras: params.get('extras') || ''
    };
  
    mount.innerHTML = `
      <header class="site-header">
        <h1 class="brand">PORTATO — 추천 결과</h1>
        <p class="tagline">당신의 선택으로 완성된 오늘의 공연 무드</p>
      </header>
  
      <section class="result">
        <h2 class="step__title">당신에게 어울리는 포르타토의 순간</h2>
        <p class="step__hint">방금 선택한 요소로 공연의 결을 시각화했습니다.</p>
        <div id="posterWrap" style="border:1px solid #eee; background:#fff; border-radius:8px; overflow:hidden; margin:12px 0;">
          <div id="poster" style="width:100%; height:480px;"></div>
        </div>
        <ul id="resultSummary" class="summary__list" style="max-width:520px; margin: 0 auto 12px;"></ul>
        <div class="nav" style="display:flex; justify-content:center; gap:.5rem;">
          <a href="index.html" class="btn">처음부터</a>
          <button id="btnDownload" class="btn btn-primary" type="button">이미지 저장</button>
        </div>
      </section>
  
      <footer class="site-footer"><small>© 2025 PORTATO</small></footer>
    `;
  
    // 요약
    const table = {
      place: "어디에서 음악을 만나고 싶나요?",
      mood:  "어떤 결의 음악을 기대하나요?",
      flow:  "몸과 시선은 어떻게 흐르면 좋을까요?",
      extras:"공연의 여운은 어떻게 이어질까요?"
    };
    const labelsMap = {
      place: { field:"들판", forest:"숲속", lake:"호수 옆", sea:"바닷가", warehouse:"폐창고", rooftop:"옥상" },
      mood:  { classical:"고전주의적", romantic:"낭만주의적", impressionist:"인상주의적", neoclassical:"신고전주의적", avantgarde:"전위적", minimal:"미니멀리즘" },
      flow:  { lie:"누워서", sit:"앉아서", walk:"걸으면서", scatter:"자유롭게 흩어져", close:"연주자 가까이서", circle:"원형으로 둘러앉아" },
      extras:{ talk:"연주자와 대화", posttalk:"포스트 토크", tea:"다과 시간", instrument:"악기 체험", drawing:"드로잉 부스", campfire:"캠프파이어" }
    };
  
    const resultSummary = document.getElementById('resultSummary');
    resultSummary.innerHTML = '';
    ['place','mood','flow','extras'].forEach(k => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.padding = '.6rem .8rem';
      li.style.background = '#fff';
      li.style.border = '1px solid #eee';
      li.style.borderRadius = '6px';
      li.style.margin = '.4rem 0';
  
      const name = document.createElement('span');
      const val  = document.createElement('strong');
      name.textContent = table[k];
      val.textContent = labelsMap[k]?.[sel[k]] || '—';
      li.appendChild(name);
      li.appendChild(val);
      resultSummary.appendChild(li);
    });
  
    // 프리뷰 SVG
    const poster = document.getElementById('poster');
    poster.innerHTML = buildSimplePosterSVG(sel);
  
    // 다운로드
    document.getElementById('btnDownload').onclick = () => downloadPosterSVG();
  }
  
  // 간단 포스터 SVG (무드 팔레트 기반)
  function buildSimplePosterSVG(sel) {
    const w = 1000, h = 600;
    const palette = moodPalettes[sel.mood] || moodPalettes.classical;
    const [bg, mid, acc, ink] = palette;
  
    return `
  <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="추천 공연 무드 프리뷰" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="${mid}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    ${[230, 200, 170, 140, 110].map(r => `<circle cx="${w/2}" cy="${h/2}" r="${r}" fill="none" stroke="${acc}" stroke-width="1" opacity="0.4"/>`).join('')}
    <g fill="${ink}">
      <text x="${w/2}" y="${h/2 - 10}" text-anchor="middle" font-size="36" font-weight="700">PORTATO 추천 무드</text>
      <text x="${w/2}" y="${h/2 + 28}" text-anchor="middle" font-size="18" opacity="0.8">
        ${sel.place || '—'} · ${sel.mood || '—'} · ${sel.flow || '—'} · ${sel.extras || '—'}
      </text>
    </g>
  </svg>`;
  }
  
  function downloadPosterSVG() {
    const poster = document.getElementById('poster');
    const svg = poster?.innerHTML?.trim();
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portato_recommendation.svg';
    a.click();
    URL.revokeObjectURL(url);
  }