// Screen displacement is converted back into coordinate units; the function is never changed.
export function panRange(o,dx,dy,width,height){
 const x=dx/width*(o.xmax-o.xmin),y=dy/height*(o.ymax-o.ymin);
 return {xmin:o.xmin-x,xmax:o.xmax-x,ymin:o.ymin+y,ymax:o.ymax+y};
}
export function zoomRange(o,factor,cx=(o.xmin+o.xmax)/2,cy=(o.ymin+o.ymax)/2){
 return {xmin:cx+(o.xmin-cx)*factor,xmax:cx+(o.xmax-cx)*factor,ymin:cy+(o.ymin-cy)*factor,ymax:cy+(o.ymax-cy)*factor};
}
export function validRange(o){return [o.xmin,o.xmax,o.ymin,o.ymax].every(x=>Number.isFinite(x)&&Math.abs(x)<=1e6)&&o.xmax-o.xmin>=1e-6&&o.ymax-o.ymin>=1e-6;}
// Ramer–Douglas–Peucker, bounded to 0.2 drawing units; each discontinuous segment stays separate.
export function simplify(points,tolerance=.2){
 if(points.length<3)return points;
 const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
 let max=0,idx=0;
 for(let i=1;i<points.length-1;i++){const p=points[i],t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)):0,d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);if(d>max){max=d;idx=i;}}
 return max<=tolerance?[a,b]:[...simplify(points.slice(0,idx+1),tolerance).slice(0,-1),...simplify(points.slice(idx),tolerance)];
}
