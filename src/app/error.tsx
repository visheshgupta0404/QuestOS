'use client';
export default function ErrorPage({reset}:{reset:()=>void}) { return <main><section className="panel empty"><h1>Your adventure hit a bump.</h1><p>Try again to return to your workspace. Check receipts before repeating a Gmail action.</p><button className="button" onClick={reset}>Try again</button></section></main>; }
