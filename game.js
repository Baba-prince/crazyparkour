(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const overlay = document.getElementById("overlay");
  const customizeCard = document.getElementById("customizeCard");
  const menuCard = document.getElementById("menuCard");
  const clearCard = document.getElementById("clearCard");
  const failCard = document.getElementById("failCard");
  const winCard = document.getElementById("winCard");
  const clearText = document.getElementById("clearText");
  const hudStage = document.getElementById("hudStage");
  const hudTier = document.getElementById("hudTier");
  const hudObstacle = document.getElementById("hudObstacle");
  const hudDeaths = document.getElementById("hudDeaths");
  const preview = document.getElementById("preview");
  const previewCtx = preview.getContext("2d");

  const BODY_COLORS = ["#3dffb5", "#5ad4ff", "#ffd166", "#ff6b4a", "#c084fc", "#ff4d6d", "#ffffff", "#2a2a2a"];
  const TRIM_COLORS = ["#062016", "#1a2a40", "#7a3e12", "#ffe082", "#e8eef8", "#ff4d6d", "#3dffb5", "#7ad4ff"];

  const appearance = {
    body: BODY_COLORS[0],
    trim: TRIM_COLORS[0],
    eyes: "dot",
    hat: "none",
  };

  function drawCharacter(c, x, y, w, h, facing, wet) {
    const body = wet ? "#5ad4ff" : appearance.body;
    const trim = appearance.trim;
    c.fillStyle = body;
    roundRectOn(c, x, y, w, h, 8);
    c.fill();

    // shoes / trim stripe
    c.fillStyle = trim;
    c.globalAlpha = 0.85;
    c.fillRect(x + 3, y + h - 10, w - 6, 7);
    c.globalAlpha = 1;

    // eyes
    c.fillStyle = "#062016";
    const eyeY = y + 10;
    if (appearance.eyes === "cool") {
      c.fillStyle = "#111";
      c.fillRect(x + 4, eyeY, w - 8, 7);
      c.fillStyle = "#7ad4ff";
      c.fillRect(x + 6, eyeY + 2, 5, 3);
      c.fillRect(x + w - 11, eyeY + 2, 5, 3);
    } else if (appearance.eyes === "happy") {
      c.strokeStyle = "#062016";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x + (facing > 0 ? 10 : 8), eyeY + 4, 3, Math.PI, 0);
      c.arc(x + (facing > 0 ? 20 : 18), eyeY + 4, 3, Math.PI, 0);
      c.stroke();
    } else if (appearance.eyes === "wink") {
      c.fillRect(facing > 0 ? x + 8 : x + 6, eyeY + 2, 5, 5);
      c.fillRect(facing > 0 ? x + 18 : x + 16, eyeY + 4, 5, 2);
    } else {
      const eyeX = facing > 0 ? x + 16 : x + 6;
      c.fillRect(eyeX, eyeY, 6, 6);
      c.fillRect(eyeX - 10, eyeY, 5, 5);
    }

    // hats
    if (appearance.hat === "cap") {
      c.fillStyle = trim;
      c.fillRect(x + 2, y - 2, w - 4, 8);
      c.fillRect(facing > 0 ? x + w - 4 : x - 8, y, 12, 5);
    } else if (appearance.hat === "crown") {
      c.fillStyle = "#ffd166";
      c.beginPath();
      c.moveTo(x + 4, y);
      c.lineTo(x + 8, y - 10);
      c.lineTo(x + w / 2, y - 2);
      c.lineTo(x + w - 8, y - 10);
      c.lineTo(x + w - 4, y);
      c.closePath();
      c.fill();
    } else if (appearance.hat === "band") {
      c.fillStyle = trim;
      c.fillRect(x + 1, y + 2, w - 2, 6);
    } else if (appearance.hat === "afro") {
      c.fillStyle = trim;
      c.beginPath();
      c.arc(x + w / 2, y + 2, 16, 0, Math.PI * 2);
      c.fill();
    }

    if (wet) {
      c.strokeStyle = "rgba(255,255,255,0.45)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x - 4, y + 22);
      c.lineTo(x - 12, y + 28);
      c.moveTo(x + w + 4, y + 22);
      c.lineTo(x + w + 12, y + 28);
      c.stroke();
    }
  }

  function roundRectOn(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function paintPreview() {
    previewCtx.clearRect(0, 0, preview.width, preview.height);
    previewCtx.fillStyle = "rgba(255,255,255,0.04)";
    previewCtx.fillRect(0, 0, preview.width, preview.height);
    drawCharacter(previewCtx, 36, 40, 48, 70, 1, false);
  }

  function buildSwatches(containerId, colors, key) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    colors.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch" + (appearance[key] === color ? " active" : "");
      btn.style.setProperty("--c", color);
      btn.title = color;
      btn.addEventListener("click", () => {
        appearance[key] = color;
        [...el.children].forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        paintPreview();
      });
      el.appendChild(btn);
    });
  }

  buildSwatches("bodySwatches", BODY_COLORS, "body");
  buildSwatches("trimSwatches", TRIM_COLORS, "trim");
  document.getElementById("eyeSelect").addEventListener("change", (e) => {
    appearance.eyes = e.target.value;
    paintPreview();
  });
  document.getElementById("hatSelect").addEventListener("change", (e) => {
    appearance.hat = e.target.value;
    paintPreview();
  });
  paintPreview();

  // Difficulty is constant within each 5-stage tier
  const TIER_DIFF = [
    null,
    { name: "Warm-up", platformW: 140, gap: 70, heightVar: 28, moverSpeed: 0, length: 1100, gravity: 0.55 },
    { name: "Getting spicy", platformW: 112, gap: 100, heightVar: 46, moverSpeed: 0, length: 1250, gravity: 0.56 },
    { name: "Movers", platformW: 100, gap: 115, heightVar: 50, moverSpeed: 1.15, length: 1350, gravity: 0.57 },
    { name: "Hazard zone", platformW: 92, gap: 125, heightVar: 54, moverSpeed: 1.35, length: 1450, gravity: 0.58 },
    { name: "Precision", platformW: 78, gap: 135, heightVar: 58, moverSpeed: 1.5, length: 1550, gravity: 0.59 },
    { name: "Master run", platformW: 68, gap: 150, heightVar: 62, moverSpeed: 1.7, length: 1700, gravity: 0.6 },
  ];

  // Each stage = new obstacle; difficulty only changes every 5 stages
  const STAGE_OBSTACLES = [
    null,
    // Tier 1 — Warm-up
    { name: "Swim & dodge", motif: "swim" },
    { name: "Stair climb", motif: "stairs_up" },
    { name: "Drop steps", motif: "stairs_down" },
    { name: "Narrow beams", motif: "narrow" },
    { name: "Rhythm hops", motif: "rhythm" },
    // Tier 2 — Getting spicy
    { name: "Wide chasms", motif: "wide_gaps" },
    { name: "High ledges", motif: "high" },
    { name: "Zigzag path", motif: "zigzag" },
    { name: "Tiny pads", motif: "tiny" },
    { name: "Kill bricks", motif: "kill_bricks" },
    // Tier 3 — Movers (same tier difficulty)
    { name: "Moving floors", motif: "movers" },
    { name: "Elevators", motif: "elevators" },
    { name: "Mover hops", motif: "mover_gaps" },
    { name: "Twin tracks", motif: "twin_movers" },
    { name: "Brick elevators", motif: "brick_elevators" },
    // Tier 4 — Hazards
    { name: "Spike pads", motif: "spikes" },
    { name: "Kill brick lane", motif: "brick_lane" },
    { name: "Spikes + movers", motif: "spike_movers" },
    { name: "Spike stairs", motif: "spike_stairs" },
    { name: "Brick gauntlet", motif: "brick_gauntlet" },
    // Tier 5 — Precision / ice
    { name: "Ice floors", motif: "ice" },
    { name: "Ice gaps", motif: "ice_gaps" },
    { name: "Ice elevators", motif: "ice_movers" },
    { name: "Frost bricks", motif: "frost_bricks" },
    { name: "Ice marathon", motif: "ice_run" },
    // Tier 6 — Master (mixes, same hard difficulty)
    { name: "Combo course", motif: "combo" },
    { name: "Deadly movers", motif: "master_movers" },
    { name: "Brick storm", motif: "brick_storm" },
    { name: "Triple threat", motif: "triple" },
    { name: "Final trial", motif: "finale" },
  ];

  function tierIndex(stage) {
    return Math.ceil(stage / 5);
  }

  function tierFor(stage) {
    return TIER_DIFF[tierIndex(stage)];
  }

  function obstacleFor(stage) {
    return STAGE_OBSTACLES[stage];
  }

  function seeded(n) {
    let s = (n * 9301 + 49297) % 233280;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function addSpike(hazards, x, y) {
    hazards.push({ kind: "spike", x: x + 4, y: y - 16, w: 16, h: 16 });
  }

  function addKillBrick(hazards, x, y, w, h) {
    hazards.push({
      kind: "kill",
      x,
      y,
      w: w || 28,
      h: h || 28,
    });
  }

  /** Stages that feature deadly red kill bricks */
  function usesKillBricks(motif) {
    return (
      motif === "swim" ||
      motif === "kill_bricks" ||
      motif === "brick_elevators" ||
      motif === "brick_lane" ||
      motif === "brick_gauntlet" ||
      motif === "frost_bricks" ||
      motif === "brick_storm" ||
      motif === "combo" ||
      motif === "triple" ||
      motif === "finale"
    );
  }

  function buildStage(stage) {
    const tier = tierFor(stage);
    const obstacle = obstacleFor(stage);
    const motif = obstacle.motif;
    const rnd = seeded(stage * 97 + 13);
    const platforms = [];
    const hazards = [];
    const band = tierIndex(stage);

    platforms.push({
      x: 40,
      y: 420,
      w: 180,
      h: 22,
      type: "solid",
      vx: 0,
      vy: 0,
      range: 0,
      baseX: 40,
      baseY: 420,
      axis: "x",
    });

    let x = 240;
    let lastY = 420;
    const endX = tier.length;
    let step = 0;

    while (x < endX - 160) {
      step += 1;
      let w = tier.platformW;
      let gap = tier.gap;
      let y = lastY;
      let type = "solid";
      let vx = 0;
      let vy = 0;
      let range = 0;
      let axis = "x";
      let putSpike = false;
      let putKillBrick = false;
      let floatingBrick = false;

      switch (motif) {
        case "swim":
          // Floating islands / reefs — dodge spikes & kill bricks in the water
          gap = 100 + rnd() * 30;
          w = 95 + rnd() * 35;
          if (step % 3 === 0) y = 230; // surface dock
          else if (step % 3 === 1) y = 320; // mid water
          else y = 400; // deep reef
          // Alternate hazards to swim around
          if (step > 1 && step % 2 === 0) floatingBrick = true;
          if (step > 1 && step % 2 === 1) putSpike = true;
          if (step > 2 && step % 4 === 0) putKillBrick = true;
          break;
        case "gaps":
          gap = tier.gap;
          y = 420;
          break;
        case "stairs_up":
          gap = tier.gap * 0.75;
          y = Math.max(200, lastY - 36);
          break;
        case "stairs_down":
          gap = tier.gap * 0.75;
          y = Math.min(470, lastY + 36);
          break;
        case "narrow":
          w = Math.max(54, tier.platformW * 0.55);
          gap = tier.gap * 0.85;
          y = 400 + (rnd() - 0.5) * 30;
          break;
        case "rhythm":
          gap = tier.gap;
          y = step % 2 === 0 ? 400 : 340;
          break;
        case "wide_gaps":
          gap = tier.gap * 1.15;
          y = 410 + (rnd() - 0.5) * 20;
          break;
        case "high":
          gap = tier.gap * 0.9;
          y = step % 3 === 0 ? Math.max(200, lastY - 70) : 400;
          break;
        case "zigzag":
          gap = tier.gap;
          y = step % 2 === 0 ? 300 : 440;
          break;
        case "tiny":
          w = Math.max(48, tier.platformW * 0.45);
          gap = tier.gap * 0.9;
          y = 380 + (rnd() - 0.5) * tier.heightVar;
          break;
        case "long":
          gap = tier.gap * 0.7;
          w = tier.platformW * 1.1;
          y = 420 + Math.sin(step) * 20;
          break;
        case "kill_bricks":
          gap = tier.gap;
          y = 400 + (rnd() - 0.5) * 40;
          floatingBrick = step % 2 === 1;
          break;
        case "movers":
          type = "moving";
          axis = "x";
          vx = (step % 2 === 0 ? 1 : -1) * tier.moverSpeed;
          range = 55;
          y = 390;
          break;
        case "elevators":
          type = "moving";
          axis = "y";
          vy = (step % 2 === 0 ? 1 : -1) * tier.moverSpeed;
          range = 55;
          y = 360;
          gap = tier.gap * 0.95;
          break;
        case "mover_gaps":
          if (step % 2 === 0) {
            type = "moving";
            axis = "x";
            vx = tier.moverSpeed;
            range = 50;
          }
          gap = tier.gap;
          y = 380 + (rnd() - 0.5) * 40;
          break;
        case "twin_movers":
          type = "moving";
          axis = step % 2 === 0 ? "x" : "y";
          if (axis === "x") vx = tier.moverSpeed * (step % 4 < 2 ? 1 : -1);
          else vy = tier.moverSpeed * (step % 4 < 2 ? 1 : -1);
          range = 60;
          y = 350 + (step % 3) * 25;
          break;
        case "mover_gauntlet":
          type = "moving";
          axis = step % 3 === 0 ? "y" : "x";
          if (axis === "x") vx = (step % 2 ? 1 : -1) * tier.moverSpeed;
          else vy = (step % 2 ? 1 : -1) * tier.moverSpeed;
          range = 70;
          w = tier.platformW * 0.9;
          y = 340 + (rnd() - 0.5) * 50;
          break;
        case "brick_elevators":
          type = "moving";
          axis = "y";
          vy = (step % 2 === 0 ? 1 : -1) * tier.moverSpeed;
          range = 55;
          y = 360;
          gap = tier.gap * 0.95;
          floatingBrick = step % 2 === 1;
          break;
        case "spikes":
          putSpike = true;
          y = 410;
          gap = tier.gap;
          break;
        case "brick_lane":
          putKillBrick = step % 2 === 1;
          y = 400;
          w = tier.platformW * 1.05;
          gap = tier.gap * 0.8;
          floatingBrick = step % 3 === 0;
          break;
        case "spike_lane":
          putSpike = step % 2 === 1;
          y = 400;
          w = tier.platformW * 1.05;
          gap = tier.gap * 0.8;
          break;
        case "spike_movers":
          type = step % 2 === 0 ? "moving" : "solid";
          if (type === "moving") {
            axis = "x";
            vx = tier.moverSpeed;
            range = 50;
          } else {
            putSpike = true;
          }
          y = 390;
          break;
        case "spike_stairs":
          putSpike = step % 2 === 0;
          gap = tier.gap * 0.75;
          y = Math.max(210, 450 - step * 28);
          break;
        case "hazard_run":
          putSpike = rnd() < 0.55;
          if (step % 4 === 0) {
            type = "moving";
            axis = "x";
            vx = tier.moverSpeed;
            range = 45;
          }
          y = 380 + (rnd() - 0.5) * tier.heightVar;
          break;
        case "brick_gauntlet":
          putKillBrick = step % 2 === 0;
          floatingBrick = step % 2 === 1;
          if (step % 4 === 0) {
            type = "moving";
            axis = "x";
            vx = tier.moverSpeed;
            range = 45;
          }
          y = 370 + (rnd() - 0.5) * tier.heightVar;
          gap = tier.gap;
          break;
        case "ice":
          type = "ice";
          y = 415;
          gap = tier.gap * 0.85;
          break;
        case "ice_gaps":
          type = "ice";
          gap = tier.gap;
          y = 400 + (rnd() - 0.5) * 30;
          break;
        case "ice_movers":
          type = step % 2 === 0 ? "ice" : "moving";
          if (type === "moving") {
            axis = "y";
            vy = tier.moverSpeed;
            range = 50;
          }
          y = 370;
          break;
        case "ice_spikes":
          type = "ice";
          putSpike = step % 2 === 1;
          y = 405;
          break;
        case "frost_bricks":
          type = "ice";
          putKillBrick = step % 2 === 0;
          floatingBrick = step % 3 === 1;
          y = 400 + (rnd() - 0.5) * 30;
          gap = tier.gap;
          break;
        case "ice_run":
          type = "ice";
          gap = tier.gap * 0.75;
          w = tier.platformW * 1.05;
          y = 390 + Math.sin(step * 0.9) * 35;
          break;
        case "combo":
          if (step % 3 === 0) type = "moving";
          else if (step % 3 === 1) type = "ice";
          if (type === "moving") {
            axis = "x";
            vx = tier.moverSpeed;
            range = 50;
          }
          putSpike = step % 5 === 0;
          floatingBrick = step % 4 === 2;
          y = 360 + (rnd() - 0.5) * tier.heightVar;
          break;
        case "master_movers":
          type = "moving";
          axis = step % 2 === 0 ? "x" : "y";
          if (axis === "x") vx = (step % 4 < 2 ? 1 : -1) * tier.moverSpeed;
          else vy = (step % 4 < 2 ? 1 : -1) * tier.moverSpeed;
          range = 75;
          putSpike = step % 3 === 0;
          y = 340 + (rnd() - 0.5) * 60;
          break;
        case "brick_storm":
          type = step % 3 === 0 ? "ice" : "solid";
          floatingBrick = true;
          putKillBrick = step % 2 === 0;
          gap = tier.gap;
          y = step % 2 === 0 ? 320 : 430;
          break;
        case "master_ice":
          type = "ice";
          putSpike = step % 2 === 0;
          gap = tier.gap;
          y = step % 2 === 0 ? 320 : 430;
          break;
        case "triple":
          if (step % 3 === 0) {
            type = "moving";
            axis = "x";
            vx = tier.moverSpeed;
            range = 55;
          } else if (step % 3 === 1) {
            type = "ice";
            putSpike = true;
          } else {
            putKillBrick = true;
          }
          floatingBrick = step % 4 === 0;
          y = 350 + (rnd() - 0.5) * tier.heightVar;
          break;
        case "finale":
          if (step % 4 === 0) {
            type = "moving";
            axis = step % 8 === 0 ? "y" : "x";
            if (axis === "x") vx = tier.moverSpeed;
            else vy = tier.moverSpeed;
            range = 70;
          } else if (step % 4 === 1) {
            type = "ice";
          } else if (step % 4 === 2) {
            putSpike = true;
          } else {
            type = "ice";
            putKillBrick = true;
          }
          floatingBrick = step % 3 === 0;
          w = tier.platformW * (0.85 + rnd() * 0.2);
          gap = tier.gap * (0.9 + rnd() * 0.15);
          y = 300 + rnd() * 140;
          break;
        default:
          y = 400;
      }

      y = Math.min(475, Math.max(180, y));
      x += gap;

      const plat = {
        x,
        y,
        w,
        h: 20,
        type,
        vx,
        vy,
        range,
        baseX: x,
        baseY: y,
        axis,
      };
      platforms.push(plat);

      if (putSpike && type !== "moving") {
        addSpike(hazards, x + w * 0.35, y);
        if (w > 100) addSpike(hazards, x + w * 0.65, y);
      }

      // Kill brick sitting on a platform (motif-specific)
      if (putKillBrick && type !== "moving" && step > 1) {
        addKillBrick(hazards, x + w * 0.5 - 14, y - 28, 28, 28);
      }

      // Stages 5+: step-on kill bricks on some solid platforms (jump over them)
      if (
        stage >= 5 &&
        type === "solid" &&
        step > 1 &&
        !putKillBrick &&
        step % 3 === 0
      ) {
        const bw = Math.min(32, Math.max(24, w * 0.35));
        addKillBrick(hazards, x + w * 0.5 - bw / 2, y - 28, bw, 28);
      }

      // Floating kill brick in the gap — jump over / swim around
      if (floatingBrick && usesKillBricks(motif)) {
        const brickX = x - gap * 0.55;
        let brickY;
        if (motif === "swim") {
          // Place in open water between reefs so you must swim around
          brickY = 280 + rnd() * 120;
        } else {
          brickY = Math.min(y, lastY) - 70 - rnd() * 40;
        }
        addKillBrick(hazards, brickX, Math.max(200, brickY), 30, 30);
      }

      // Swim stage: extra spike clusters floating mid-water to dodge
      if (motif === "swim" && step > 1 && step % 3 === 0) {
        const sx = x - gap * 0.35;
        const sy = 300 + (step % 2) * 80;
        addSpike(hazards, sx, sy + 16);
        addSpike(hazards, sx + 22, sy + 16);
      }

      lastY = y;
      x += w;
    }

    const goalX = x + 70;
    const goalY = Math.min(440, lastY + 10);
    platforms.push({
      x: goalX,
      y: goalY,
      w: 140,
      h: 22,
      type: "solid",
      vx: 0,
      vy: 0,
      range: 0,
      baseX: goalX,
      baseY: goalY,
      axis: "x",
    });

    const isSwim = motif === "swim";
    // Swim stage: start on a surface dock, water fills most of the view
    if (isSwim) {
      platforms[0].y = 230;
      platforms[0].w = 200;
      // Sandy seabed so you don't fall forever
      platforms.push({
        x: 0,
        y: 500,
        w: goalX + 400,
        h: 40,
        type: "solid",
        vx: 0,
        vy: 0,
        range: 0,
        baseX: 0,
        baseY: 500,
        axis: "x",
      });
      // Seabed spike traps near the bottom — don't hug the floor
      for (let i = 1; i < 8; i++) {
        const bx = 280 + i * 160;
        if (bx < goalX - 80) {
          addSpike(hazards, bx, 500);
          addSpike(hazards, bx + 20, 500);
          if (i % 2 === 0) addKillBrick(hazards, bx + 70, 430, 28, 28);
        }
      }
    }

    return {
      platforms,
      hazards,
      flag: { x: goalX + 55, y: goalY - 70, w: 10, h: 70 },
      spawn: isSwim ? { x: 100, y: 180 } : { x: 90, y: 360 },
      width: goalX + 220,
      difficulty: { ...tier, band },
      obstacle,
      water: isSwim ? { surfaceY: 250 } : null,
    };
  }

  const keys = Object.create(null);
  let stage = 1;
  let deaths = 0;
  let level = null;
  let mode = "menu"; // menu | play | clear | fail | win
  let camX = 0;
  let particles = [];

  const player = {
    x: 90,
    y: 360,
    w: 28,
    h: 36,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    coyote: 0,
    jumpBuf: 0,
    jumpHold: 0, // frames left where holding jump still adds height
  };

  function resetPlayer() {
    player.x = level.spawn.x;
    player.y = level.spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuf = 0;
    player.jumpHold = 0;
    camX = 0;
    particles = [];
  }

  function loadStage(n) {
    stage = n;
    level = buildStage(stage);
    resetPlayer();
    hudStage.textContent = String(stage);
    hudTier.textContent = tierFor(stage).name;
    hudObstacle.textContent = obstacleFor(stage).name;
    hudDeaths.textContent = String(deaths);
  }

  function show(card) {
    customizeCard.classList.add("hidden");
    menuCard.classList.add("hidden");
    clearCard.classList.add("hidden");
    failCard.classList.add("hidden");
    winCard.classList.add("hidden");
    card.classList.remove("hidden");
    overlay.classList.remove("playing");
  }

  function play() {
    mode = "play";
    overlay.classList.add("playing");
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function updateMovers(dt) {
    for (const p of level.platforms) {
      if (p.type !== "moving") continue;
      if (p.axis === "y") {
        p.y += p.vy * dt * 60;
        if (p.y > p.baseY + p.range) {
          p.y = p.baseY + p.range;
          p.vy *= -1;
        } else if (p.y < p.baseY - p.range) {
          p.y = p.baseY - p.range;
          p.vy *= -1;
        }
      } else {
        p.x += p.vx * dt * 60;
        if (p.x > p.baseX + p.range) {
          p.x = p.baseX + p.range;
          p.vx *= -1;
        } else if (p.x < p.baseX - p.range) {
          p.x = p.baseX - p.range;
          p.vx *= -1;
        }
      }
    }
  }

  function resolvePlatforms(prevBottom) {
    player.onGround = false;
    let rideVx = 0;
    let rideVy = 0;

    for (const p of level.platforms) {
      if (!rectsOverlap(player, p)) continue;

      const overlapX = Math.min(player.x + player.w, p.x + p.w) - Math.max(player.x, p.x);
      const overlapY = Math.min(player.y + player.h, p.y + p.h) - Math.max(player.y, p.y);

      if (overlapX < overlapY) {
        if (player.x + player.w / 2 < p.x + p.w / 2) player.x = p.x - player.w;
        else player.x = p.x + p.w;
        player.vx = 0;
      } else {
        if (prevBottom <= p.y + 4 && player.vy >= 0) {
          player.y = p.y - player.h;
          player.vy = 0;
          player.onGround = true;
          if (p.type === "moving") {
            rideVx = p.axis === "x" ? p.vx : 0;
            rideVy = p.axis === "y" ? p.vy : 0;
          }
        } else if (player.vy < 0) {
          player.y = p.y + p.h;
          player.vy = 0;
        }
      }
    }

    if (player.onGround) {
      player.x += rideVx;
      player.y += rideVy;
    }
  }

  function checkHazards() {
    for (const h of level.hazards) {
      if (rectsOverlap(player, h)) return true;
    }
    return false;
  }

  function checkFlag() {
    const f = level.flag;
    const box = { x: f.x - 8, y: f.y, w: 36, h: f.h };
    return rectsOverlap(player, box);
  }

  function burst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.8) * 5,
        life: 25 + Math.random() * 15,
        color,
      });
    }
  }

  function fail() {
    deaths += 1;
    hudDeaths.textContent = String(deaths);
    mode = "fail";
    show(failCard);
    burst(player.x + player.w / 2, player.y + player.h / 2, "#ff6b4a");
  }

  function clearStage() {
    burst(level.flag.x, level.flag.y + 20, "#ffd166");
    if (stage >= 30) {
      mode = "win";
      show(winCard);
      return;
    }
    mode = "clear";
    const next = stage + 1;
    if (next <= 30 && tierIndex(next) !== tierIndex(stage)) {
      clearText.textContent = `Tier up! Difficulty rises — next: ${obstacleFor(next).name}.`;
    } else if (next <= 30) {
      clearText.textContent = `Same difficulty. New obstacle ahead: ${obstacleFor(next).name}.`;
    } else {
      clearText.textContent = "Stage done.";
    }
    show(clearCard);
  }

  function playerInWater() {
    return !!(level.water && player.y + player.h * 0.35 > level.water.surfaceY);
  }

  function update(dt) {
    if (mode !== "play") {
      updateParticles();
      return;
    }

    updateMovers(dt);

    const d = level.difficulty;
    const left = keys["ArrowLeft"] || keys["a"] || keys["A"];
    const right = keys["ArrowRight"] || keys["d"] || keys["D"];
    const jump =
      keys["ArrowUp"] || keys["w"] || keys["W"] || keys[" "] || keys["Space"];
    const down = keys["ArrowDown"] || keys["s"] || keys["S"];
    const swimming = playerInWater();

    // Detect ice underfoot approx
    let onIce = false;
    if (player.onGround && !swimming) {
      for (const p of level.platforms) {
        if (
          p.type === "ice" &&
          player.x + player.w > p.x &&
          player.x < p.x + p.w &&
          Math.abs(player.y + player.h - p.y) < 3
        ) {
          onIce = true;
          break;
        }
      }
    }

    if (swimming) {
      // Swim physics — move freely in the water
      const swimAccel = 0.35;
      const swimMax = 3.6;
      if (left) {
        player.vx -= swimAccel;
        player.facing = -1;
      }
      if (right) {
        player.vx += swimAccel;
        player.facing = 1;
      }
      if (!left && !right) player.vx *= 0.9;
      player.vx = Math.max(-swimMax, Math.min(swimMax, player.vx));

      if (jump) player.vy -= 0.42;
      if (down) player.vy += 0.38;
      // Buoyancy + light drag
      player.vy += 0.08;
      player.vy *= 0.94;
      player.vy = Math.max(-4.2, Math.min(4.2, player.vy));
      player.coyote = 0;
      player.jumpBuf = 0;
      player.jumpHold = 0;

      // Bubbles while swimming
      if (Math.random() < 0.12) {
        particles.push({
          x: player.x + player.w / 2 + (Math.random() - 0.5) * 16,
          y: player.y + 8,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -1.2 - Math.random(),
          life: 30 + Math.random() * 20,
          color: "rgba(180,230,255,0.8)",
        });
      }
    } else {
      const accel = onIce ? 0.25 : 0.55;
      const maxSpeed = onIce ? 5.2 : 4.4;
      const friction = onIce ? 0.992 : 0.82;

      if (left) {
        player.vx -= accel;
        player.facing = -1;
      }
      if (right) {
        player.vx += accel;
        player.facing = 1;
      }
      if (!left && !right) player.vx *= friction;
      player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

      if (player.onGround) player.coyote = 8;
      else player.coyote = Math.max(0, player.coyote - 1);

      if (jump) player.jumpBuf = 8;
      else player.jumpBuf = Math.max(0, player.jumpBuf - 1);

      if (player.jumpBuf > 0 && player.coyote > 0) {
        // Base hop — keep holding W / Space / ↑ to go higher
        player.vy = -9.4;
        player.onGround = false;
        player.coyote = 0;
        player.jumpBuf = 0;
        player.jumpHold = 14;
        burst(player.x + player.w / 2, player.y + player.h, "#3dffb5");
        if (window.ParkourMusic) window.ParkourMusic.jump();
      }

      // Hold jump to gain extra height; release early for a short hop
      if (jump && player.jumpHold > 0 && player.vy < 0) {
        player.vy -= 0.72;
        player.jumpHold -= 1;
        if (player.vy < -13.5) player.vy = -13.5;
      } else if (!jump) {
        player.jumpHold = 0;
        if (player.vy < -3) player.vy *= 0.82;
      } else {
        player.jumpHold = 0;
      }

      player.vy += d.gravity;
      if (player.vy > 14) player.vy = 14;
    }

    const prevBottom = player.y + player.h;
    player.x += player.vx;
    player.y += player.vy;

    resolvePlatforms(prevBottom);

    if (player.y > H + 40 || checkHazards()) {
      fail();
      return;
    }

    if (checkFlag()) {
      clearStage();
      return;
    }

    // Camera
    const target = player.x - W * 0.35;
    camX += (target - camX) * 0.12;
    camX = Math.max(0, Math.min(camX, level.width - W));

    updateParticles();
  }

  function updateParticles() {
    particles = particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 1;
      return p.life > 0;
    });
  }

  // Unique sky for each of the 30 stages
  const STAGE_BACKGROUNDS = [
    null,
    { sky: ["#5eb8e8", "#87d4f0"], hills: "#2a7a6a", accent: "ocean", ground: "#1a5a68" },
    { sky: ["#9ad0f0", "#e8f4c8"], hills: "#4a8a5c", accent: "clouds", ground: "#3a7548" },
    { sky: ["#6bb0d4", "#a8d4b0"], hills: "#2d5a40", accent: "birds", ground: "#254a35" },
    { sky: ["#8ec5e8", "#f0e6b8"], hills: "#5a7a40", accent: "suncloud", ground: "#4a6a35" },
    { sky: ["#5a9ec8", "#d4e8a0"], hills: "#356a48", accent: "rays", ground: "#2a5538" },
    { sky: ["#4a80b0", "#e8b878"], hills: "#4a5a38", accent: "sunset", ground: "#3a4528" },
    { sky: ["#3a6898", "#d48868"], hills: "#3a4a40", accent: "dusk", ground: "#2a3530" },
    { sky: ["#2a4870", "#c07060"], hills: "#2a3a38", accent: "evening", ground: "#1e2a28" },
    { sky: ["#1e3858", "#a85870"], hills: "#243038", accent: "twilight", ground: "#181e28" },
    { sky: ["#152838", "#704860"], hills: "#1a2830", accent: "stars", ground: "#101820" },
    { sky: ["#101e30", "#203848"], hills: "#182830", accent: "moon", ground: "#0c141c" },
    { sky: ["#0c1828", "#183040"], hills: "#142028", accent: "moonstars", ground: "#0a1018" },
    { sky: ["#141828", "#283850"], hills: "#1c2430", accent: "neon", ground: "#10141c" },
    { sky: ["#181020", "#302040"], hills: "#201828", accent: "aurora", ground: "#140c18" },
    { sky: ["#0e2030", "#204858"], hills: "#183038", accent: "grid", ground: "#0c1820" },
    { sky: ["#201018", "#481828"], hills: "#28141c", accent: "embers", ground: "#180c10" },
    { sky: ["#180c14", "#401020"], hills: "#200c14", accent: "lava", ground: "#140810" },
    { sky: ["#1a1020", "#381828"], hills: "#221018", accent: "crags", ground: "#120810" },
    { sky: ["#140c18", "#301020"], hills: "#1c0c14", accent: "ash", ground: "#100810" },
    { sky: ["#1c0810", "#480818"], hills: "#240810", accent: "hazard", ground: "#140408" },
    { sky: ["#102030", "#a0d8f0"], hills: "#284858", accent: "glacier", ground: "#183040" },
    { sky: ["#183848", "#c8e8f8"], hills: "#306070", accent: "icepeaks", ground: "#204850" },
    { sky: ["#0c2030", "#88c0e0"], hills: "#203848", accent: "frost", ground: "#142830" },
    { sky: ["#102838", "#b0e0f0"], hills: "#284050", accent: "blizzard", ground: "#1a3038" },
    { sky: ["#081828", "#70a8c8"], hills: "#182838", accent: "crystal", ground: "#0c1c28" },
    { sky: ["#100818", "#301040"], hills: "#1c0c28", accent: "void", ground: "#0c0414" },
    { sky: ["#180820", "#501038"], hills: "#280c24", accent: "plasma", ground: "#140418" },
    { sky: ["#081018", "#183060"], hills: "#101828", accent: "orbit", ground: "#080c18" },
    { sky: ["#14081c", "#602060"], hills: "#200c28", accent: "storm", ground: "#100414" },
    { sky: ["#080410", "#280820", "#602010"], hills: "#140818", accent: "finale", ground: "#0c0410" },
  ];

  function bgTheme() {
    return STAGE_BACKGROUNDS[stage] || STAGE_BACKGROUNDS[1];
  }

  function drawHills(color, speed, heightBase, count) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const span = W / count + 80;
      const hx = ((i * span - camX * speed) % (W + span * 2)) - span;
      const peak = heightBase + (i % 3) * 18;
      ctx.beginPath();
      ctx.moveTo(hx, H);
      ctx.lineTo(hx + span * 0.5, H - peak);
      ctx.lineTo(hx + span, H);
      ctx.fill();
    }
  }

  function drawClouds(color, count) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const x = ((i * 180 - camX * 0.08 + i * 40) % (W + 200)) - 60;
      const y = 50 + (i % 4) * 28;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.arc(x + 24, y - 6, 18, 0, Math.PI * 2);
      ctx.arc(x + 44, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawStars(count, color) {
    ctx.fillStyle = color || "#fff8e7";
    for (let i = 0; i < count; i++) {
      const x = (i * 97 + stage * 13) % W;
      const y = (i * 53 + stage * 29) % (H * 0.55);
      const r = 1 + (i % 3) * 0.7;
      ctx.globalAlpha = 0.45 + ((i + stage) % 5) * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSun(x, y, color, glow) {
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(x, y, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMoon(x, y) {
    ctx.fillStyle = "#e8eef8";
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bgTheme().sky[0];
    ctx.beginPath();
    ctx.arc(x + 10, y - 4, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAccent(theme) {
    const a = theme.accent;
    const t = performance.now() / 1000;

    if (a === "sun" || a === "suncloud" || a === "rays" || a === "sunset" || a === "dusk" || a === "evening") {
      const y = a === "sunset" || a === "dusk" || a === "evening" ? 120 : 70;
      const col = a === "sunset" || a === "dusk" ? "#ff9f5a" : "#ffe08a";
      drawSun(W * 0.78, y, col, col);
      if (a === "rays") {
        ctx.strokeStyle = "rgba(255, 224, 138, 0.25)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + t * 0.1;
          ctx.beginPath();
          ctx.moveTo(W * 0.78, 70);
          ctx.lineTo(W * 0.78 + Math.cos(ang) * 90, 70 + Math.sin(ang) * 90);
          ctx.stroke();
        }
      }
      if (a === "suncloud" || a === "clouds") drawClouds("rgba(255,255,255,0.55)", 5);
    }

    if (a === "clouds" || a === "birds") {
      drawClouds("rgba(255,255,255,0.45)", 6);
    }
    if (a === "birds") {
      ctx.strokeStyle = "rgba(20,30,40,0.55)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const bx = ((t * 30 + i * 140) % (W + 40)) - 20;
        const by = 80 + i * 18;
        ctx.beginPath();
        ctx.moveTo(bx - 8, by);
        ctx.quadraticCurveTo(bx, by - 6, bx + 8, by);
        ctx.stroke();
      }
    }

    if (a === "twilight" || a === "stars" || a === "moon" || a === "moonstars" || a === "void" || a === "orbit" || a === "finale") {
      drawStars(a === "finale" ? 60 : 35);
    }
    if (a === "moon" || a === "moonstars") drawMoon(W * 0.72, 80);
    if (a === "orbit") {
      ctx.strokeStyle = "rgba(120,180,255,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(W * 0.5, 100, 120, 28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#7ad4ff";
      ctx.beginPath();
      ctx.arc(W * 0.5 + Math.cos(t) * 120, 100 + Math.sin(t) * 28, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (a === "aurora" || a === "plasma" || a === "storm") {
      for (let i = 0; i < 4; i++) {
        const grad = ctx.createLinearGradient(0, 40 + i * 30, W, 100 + i * 40);
        grad.addColorStop(0, "rgba(61,255,181,0)");
        grad.addColorStop(0.4, a === "plasma" ? "rgba(255,80,180,0.2)" : "rgba(61,255,181,0.22)");
        grad.addColorStop(0.7, a === "storm" ? "rgba(160,80,255,0.2)" : "rgba(120,180,255,0.18)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 120 + i * 20);
        for (let x = 0; x <= W; x += 40) {
          ctx.lineTo(x, 80 + i * 25 + Math.sin(x * 0.01 + t + i) * 18);
        }
        ctx.lineTo(W, 200);
        ctx.lineTo(0, 200);
        ctx.fill();
      }
    }

    if (a === "neon" || a === "grid") {
      ctx.strokeStyle = "rgba(61,255,181,0.15)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x - (camX * 0.1) % 40, H * 0.45);
        ctx.lineTo(x - (camX * 0.1) % 40, H);
        ctx.stroke();
      }
      for (let y = H * 0.45; y < H; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    if (a === "embers" || a === "lava" || a === "ash" || a === "hazard" || a === "crags") {
      for (let i = 0; i < 18; i++) {
        const x = (i * 73 + t * (20 + i)) % W;
        const y = H - ((t * 40 + i * 50) % (H * 0.7));
        ctx.fillStyle = a === "ash" ? "rgba(180,180,180,0.35)" : "rgba(255,120,60,0.55)";
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (a === "glacier" || a === "icepeaks" || a === "frost" || a === "blizzard" || a === "crystal") {
      drawStars(12, "rgba(200,240,255,0.7)");
      if (a === "blizzard" || a === "frost") {
        ctx.fillStyle = "rgba(220,240,255,0.55)";
        for (let i = 0; i < 40; i++) {
          const x = (i * 59 + t * 50) % W;
          const y = (i * 37 + t * 80) % H;
          ctx.fillRect(x, y, 2, 6);
        }
      }
      if (a === "crystal") {
        ctx.strokeStyle = "rgba(160,230,255,0.35)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const x = 80 + i * 180;
          ctx.beginPath();
          ctx.moveTo(x, 180);
          ctx.lineTo(x + 20, 80);
          ctx.lineTo(x + 40, 180);
          ctx.stroke();
        }
      }
      if (a === "icepeaks") {
        ctx.fillStyle = "rgba(200,230,245,0.25)";
        for (let i = 0; i < 4; i++) {
          const x = 60 + i * 240 - (camX * 0.05) % 240;
          ctx.beginPath();
          ctx.moveTo(x, H * 0.55);
          ctx.lineTo(x + 60, H * 0.25);
          ctx.lineTo(x + 120, H * 0.55);
          ctx.fill();
        }
      }
    }

    if (a === "finale") {
      drawSun(W * 0.5, 90, "#ff6b4a", "#ffd166");
      drawClouds("rgba(80,20,40,0.35)", 4);
    }

    if (a === "ocean") {
      drawSun(W * 0.82, 64, "#ffe08a", "#ffe08a");
      drawClouds("rgba(255,255,255,0.4)", 4);
      // distant wave hints
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 20) {
          const y = 140 + i * 16 + Math.sin(x * 0.03 + t + i) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }

  function drawWater() {
    if (!level.water) return;
    const surface = level.water.surfaceY;
    const t = performance.now() / 1000;

    // Water body (world space — caller already translated by -camX)
    const grad = ctx.createLinearGradient(0, surface, 0, H + 80);
    grad.addColorStop(0, "rgba(64, 180, 220, 0.45)");
    grad.addColorStop(0.5, "rgba(30, 120, 180, 0.55)");
    grad.addColorStop(1, "rgba(10, 50, 90, 0.7)");
    ctx.fillStyle = grad;
    ctx.fillRect(camX - 20, surface, W + 40, H + 100);

    // Surface waves
    ctx.strokeStyle = "rgba(220, 250, 255, 0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = Math.floor(camX) - 20; x < camX + W + 40; x += 12) {
      const y = surface + Math.sin(x * 0.04 + t * 3) * 3;
      if (x === Math.floor(camX) - 20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Light rays in water
    ctx.strokeStyle = "rgba(180, 230, 255, 0.08)";
    ctx.lineWidth = 18;
    for (let i = 0; i < 5; i++) {
      const x = camX + 80 + i * 200;
      ctx.beginPath();
      ctx.moveTo(x, surface);
      ctx.lineTo(x + 40, H);
      ctx.stroke();
    }
  }

  function drawBackground() {
    const theme = bgTheme();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.sky[0]);
    if (theme.sky[2]) {
      g.addColorStop(0.45, theme.sky[1]);
      g.addColorStop(1, theme.sky[2]);
    } else {
      g.addColorStop(1, theme.sky[1]);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    drawAccent(theme);

    // Far hills
    drawHills(theme.hills, 0.15, 70, 5);
    // Near ground wash
    ctx.fillStyle = theme.ground;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(0, H - 70, W, 70);
    ctx.globalAlpha = 1;
    drawHills(theme.ground, 0.28, 50, 7);

    // Stage color strip
    const band = level.difficulty.band;
    const tints = ["#3dffb5", "#7ad4ff", "#ffd166", "#ff6b4a", "#c084fc", "#ff4d6d"];
    ctx.fillStyle = tints[band - 1] || "#3dffb5";
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, 0, W, 8);
    ctx.globalAlpha = 1;
  }

  function draw() {
    drawBackground();
    ctx.save();
    ctx.translate(-Math.floor(camX), 0);

    // Platforms
    for (const p of level.platforms) {
      // Hide ultra-wide seabed under water draw — still collide; draw as sand tint later
      if (level.water && p.w > 500) continue;
      if (p.type === "ice") {
        ctx.fillStyle = "#a8e4ff";
        ctx.strokeStyle = "#dff6ff";
      } else if (p.type === "moving") {
        ctx.fillStyle = "#ffb347";
        ctx.strokeStyle = "#ffe0a8";
      } else {
        ctx.fillStyle = "#2f6f57";
        ctx.strokeStyle = "#3dffb5";
      }
      // Swim reefs look sandy / coral
      if (level.water && p.type === "solid") {
        ctx.fillStyle = p.y < level.water.surfaceY + 20 ? "#c4a574" : "#3d8a7a";
        ctx.strokeStyle = p.y < level.water.surfaceY + 20 ? "#e8d4a8" : "#5dffc8";
      }
      roundRect(p.x, p.y, p.w, p.h, 6);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    drawWater();

    // Hazards: spikes + kill bricks
    for (const h of level.hazards) {
      if (h.kind === "kill") {
        // Deadly brick block
        ctx.fillStyle = "#c62828";
        ctx.strokeStyle = "#ff8a80";
        ctx.lineWidth = 2;
        roundRect(h.x, h.y, h.w, h.h, 4);
        ctx.fill();
        ctx.stroke();
        // mortar lines
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(h.x, h.y + h.h * 0.5);
        ctx.lineTo(h.x + h.w, h.y + h.h * 0.5);
        ctx.moveTo(h.x + h.w * 0.5, h.y);
        ctx.lineTo(h.x + h.w * 0.5, h.y + h.h);
        ctx.stroke();
        // warning X
        ctx.strokeStyle = "#ffe082";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(h.x + 7, h.y + 7);
        ctx.lineTo(h.x + h.w - 7, h.y + h.h - 7);
        ctx.moveTo(h.x + h.w - 7, h.y + 7);
        ctx.lineTo(h.x + 7, h.y + h.h - 7);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#ff4d6d";
        ctx.beginPath();
        ctx.moveTo(h.x, h.y + h.h);
        ctx.lineTo(h.x + h.w / 2, h.y);
        ctx.lineTo(h.x + h.w, h.y + h.h);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Flag
    const f = level.flag;
    ctx.fillStyle = "#d9e2ec";
    ctx.fillRect(f.x, f.y, 5, f.h);
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.moveTo(f.x + 5, f.y);
    ctx.lineTo(f.x + 38, f.y + 12);
    ctx.lineTo(f.x + 5, f.y + 24);
    ctx.closePath();
    ctx.fill();

    // Player (custom look)
    drawCharacter(ctx, player.x, player.y, player.w, player.h, player.facing, playerInWater());

    // Particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / 30);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // Stage label
    ctx.fillStyle = "rgba(232, 238, 248, 0.7)";
    ctx.font = "600 14px Outfit, sans-serif";
    ctx.fillText(`Stage ${stage} · ${obstacleFor(stage).name}`, 16, 28);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (level) {
      update(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }
    if ((e.key === "r" || e.key === "R") && mode === "play") {
      resetPlayer();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  function syncMusicBtn() {
    const muted = window.ParkourMusic && window.ParkourMusic.isMuted();
    musicBtn.classList.toggle("muted", !!muted);
    musicBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    musicBtn.textContent = muted ? "♪ Muted" : "♪ Music on";
  }

  async function startMusic() {
    if (!window.ParkourMusic) return;
    await window.ParkourMusic.start();
    syncMusicBtn();
  }

  const musicBtn = document.getElementById("musicBtn");
  musicBtn.addEventListener("click", async () => {
    if (!window.ParkourMusic) return;
    // First click: start unmuted. Later clicks: mute/unmute only.
    if (!window.ParkourMusic.isPlaying() && window.ParkourMusic.isMuted()) {
      window.ParkourMusic.setMuted(false);
      await startMusic();
    } else if (!window.ParkourMusic.isPlaying()) {
      await startMusic();
    } else {
      window.ParkourMusic.toggleMute();
    }
    syncMusicBtn();
  });

  document.getElementById("customizeDoneBtn").addEventListener("click", async () => {
    await startMusic();
    show(menuCard);
  });
  document.getElementById("editLookBtn").addEventListener("click", () => {
    show(customizeCard);
    paintPreview();
  });
  document.getElementById("startBtn").addEventListener("click", async () => {
    await startMusic();
    deaths = 0;
    loadStage(1);
    play();
  });
  document.getElementById("nextBtn").addEventListener("click", async () => {
    await startMusic();
    loadStage(stage + 1);
    play();
  });
  document.getElementById("retryBtn").addEventListener("click", async () => {
    await startMusic();
    resetPlayer();
    play();
  });
  document.getElementById("againBtn").addEventListener("click", async () => {
    await startMusic();
    deaths = 0;
    loadStage(1);
    play();
  });

  loadStage(1);
  show(customizeCard);
  requestAnimationFrame(frame);
})();
