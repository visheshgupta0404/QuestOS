'use client';
import { useEffect, useRef } from 'react';
export default function GameBoard({progress,total,kind}:{progress:number;total:number;kind:'inbox'|'files'}) {
  const parent = useRef<HTMLDivElement>(null);
  const game = useRef<import('phaser').Game | null>(null);
  const latest = useRef(progress);
  latest.current = progress;
  useEffect(()=>{
    let disposed = false;
    import('phaser').then(({default:Phaser})=>{
      if (disposed || !parent.current) return;
      class QuestScene extends Phaser.Scene {
        create() {
          const g = this.add.graphics();
          g.fillStyle(0xeaf1e2); g.fillRoundedRect(0,0,760,170,16);
          g.lineStyle(18,0xd6e2c8); g.lineBetween(48,100,712,100);
          g.lineStyle(3,0xffffff,.7); g.lineBetween(48,100,712,100);
          for(let i=0;i<Math.min(total,12);i++) {
            const x = 60 + i * (640 / Math.max(1,Math.min(total,12)-1));
            const token = this.add.rectangle(x,100,32,25,kind==='inbox'?0xfaf3da:0xe7b76b).setStrokeStyle(2,0xb6c9a4);
            const label = this.add.text(x,100,kind==='inbox'?'✉':'▰',{fontSize:'22px',color:'#56714c'}).setOrigin(.5);
            if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)this.tweens.add({targets:[token,label], y:93, duration:900+i*80,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
            this.events.on('update',()=>{const done=i<latest.current; token.setFillStyle(done?0x467653:0xfaf3da); label.setColor(done?'#ffffff':'#56714c');});
          }
          const hero = this.add.circle(48,142,8,0xda8859);
          this.events.on('update',()=>hero.setX(48+664*(latest.current/Math.max(total,1))));
          this.add.text(24,20,kind==='inbox'?'THE CASTLE GATES':'THE FOREST TRAIL',{fontFamily:'monospace',fontSize:'12px',color:'#6a7d61',letterSpacing:2});
        }
      }
      game.current = new Phaser.Game({type:Phaser.CANVAS,width:760,height:170,parent:parent.current,transparent:true,scene:QuestScene,banner:false,audio:{noAudio:true},fps:{target:30},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH}});
    }).catch(()=>{/* The board is decorative; accessible task controls remain usable if the renderer cannot load. */});
    return ()=>{disposed=true;game.current?.destroy(true);game.current=null;};
  },[kind,total]);
  return <div className="game-board" ref={parent} aria-hidden="true"/>;
}
