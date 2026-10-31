export function WorldArt({small=false}:{small?:boolean}) {
  return <svg className={small?'world-art small':'world-art'} viewBox="0 0 600 360" fill="none" aria-hidden="true">
    <defs><linearGradient id="land" x1="200" y1="100" x2="350" y2="350" gradientUnits="userSpaceOnUse"><stop stopColor="#c9ddab"/><stop offset="1" stopColor="#a4c987"/></linearGradient><linearGradient id="river" x1="290" y1="120" x2="410" y2="340"><stop stopColor="#a5d8d1"/><stop offset="1" stopColor="#80b9b2"/></linearGradient></defs>
    <ellipse cx="304" cy="318" rx="230" ry="24" fill="#254d3510"/>
    <path d="M65 207 293 91 543 209 316 332Z" fill="#88a979"/><path d="M65 190 293 74 543 192 316 315Z" fill="url(#land)"/><path d="M65 190v17l251 125v-17Z" fill="#8fae7e"/><path d="m316 315 227-123v17L316 332Z" fill="#789766"/>
    <path d="m269 86 48 23-29 45 49 31-16 35 81 49-36 20-95-58 15-38-48-33Z" fill="url(#river)"/>
    <path d="m134 224 72-36 69 34 89-46 80 41" stroke="#f7edc5" strokeWidth="15" strokeLinecap="round"/>
    <path d="m134 224 72-36 69 34 89-46 80 41" stroke="#d3bb87" strokeWidth="2" strokeDasharray="4 8"/>
    <path d="m267 213 25-13 30 15-26 14Z" fill="#bc8f5c"/><path d="m269 208 24-12 29 15-26 14Z" fill="#e6c69a"/>
    {[{x:126,y:152,s:1},{x:167,y:131,s:.8},{x:413,y:152,s:.9},{x:455,y:179,s:1},{x:409,y:245,s:.85},{x:181,y:250,s:.8},{x:232,y:267,s:.65},{x:365,y:119,s:.65},{x:490,y:207,s:.55}].map((t,i)=><g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}><ellipse cy="25" rx="18" ry="8" fill="#315b3620"/><path d="M-3 0h6v28h-6" fill="#8e7053"/><path d="M0-35-22 7h44Z" fill="#397552"/><path d="M0-18-26 20h52Z" fill="#4c8b5b"/><path d="M0-35v55h26L8-6h14Z" fill="#2e664b" opacity=".4"/></g>)}
    <g transform="translate(205 124)"><path d="m-43 11 43-22 45 22L0 35Z" fill="#cfb384"/><path d="m-32-18 32-16 32 16v46L0 44-32 28Z" fill="#eadabd"/><path d="M0-1v45l32-16v-46Z" fill="#d2be9e"/><path d="m-39-19 39-33 39 33L0 0Z" fill="#dc8862"/><path d="m0-52 39 33L0 0Z" fill="#c46e50"/><path d="M-41-49h18V9l-18 8Z" fill="#f4e7d0"/><path d="m-46-49 14-22 14 15-22 13Z" fill="#d9815e"/><path d="M23-49h18v66l-18-8Z" fill="#d9c5a5"/><path d="m18-56 14-15 14 22-23 6Z" fill="#cf7959"/><path d="M-7 44V24a8 8 0 0 1 14 0v20" fill="#876d54"/><path d="M0-66v-30m0 0 26 8-26 9Z" stroke="#556d47" strokeWidth="3" fill="#e8ad5d"/><path d="M-33-33v12m65-12v12" stroke="#9c8569" strokeWidth="5"/></g>
    <g transform="translate(378 211)"><path d="m-24 1 24-12L25 2 0 15Z" fill="#d4ae75"/><path d="M-20-26h40V3L0 13-20 3Z" fill="#e5c78d"/><path d="m-26-26 26-22 26 22Z" fill="#698b68"/><path d="M-9-12H9v14H-9Z" fill="#f6edce"/><path d="m-9-12 9 8 9-8" stroke="#b79e70" strokeWidth="2"/></g>
    <g transform="translate(300 231)"><ellipse cy="17" rx="11" ry="5" fill="#315b3620"/><circle cy="-12" r="8" fill="#e9b686"/><path d="M-9 0Q0-10 9 0l-2 14H-7Z" fill="#f0a35f"/><path d="M-6 14v8m12-8v8" stroke="#4a5b49" strokeWidth="4"/><path d="M-10-16q9-14 19 0Z" fill="#476a4b"/></g>
    <g fill="#f3e4b3">{[[115,196],[345,285],[448,231],[252,118],[189,213]].map(([x,y],i)=><path key={i} d={`M${x} ${y-5}l2 4 4 1-4 2-2 4-2-4-4-2 4-1Z`}/>)}</g>
    <g fill="#fffdf4" opacity=".9"><path d="M115 75q-8-15-22-5-20-2-17 11h48q7-12-9-6"/><path d="M456 79q-6-14-19-5-20-3-16 12h47q5-11-12-7"/></g>
  </svg>;
}
