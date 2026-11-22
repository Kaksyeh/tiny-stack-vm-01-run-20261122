// Tiny stack VM, ISA v1. One run answers all 40 instances i001..i040.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const IN=process.env.MAKEFUN_INPUT_DIR||'/input',OUT=process.env.MAKEFUN_OUTPUT_DIR||'/output';
const IL=new Uint8Array(256);IL[1]=1;IL[2]=4;IL[48]=IL[49]=IL[50]=IL[51]=2;
function run(p:Uint8Array,inp:Uint8Array){
  const st=new Int32Array(257);let sp=0;
  const cs=new Int32Array(64);let cp=0;
  const mem=new Int32Array(256);
  const out=new Uint8Array(65536);let ol=0,ip=0,pc=0,steps=0;
  const n=p.length;
  const end=(code:number)=>({o:out.subarray(0,ol),c:code});
  for(;;){
    if(steps>=1000000)return end(10);
    if(pc<0||pc>=n)return end(9);
    const op=p[pc];
    const il=IL[op];
    if(pc+1+il>n)return end(9);
    steps++;
    switch(op){
      case 0x00:return end(0);
      case 0x01:{if(sp>=256)return end(3);const b=p[pc+1];st[sp++]=b<128?b:b-256;break;}
      case 0x02:{if(sp>=256)return end(3);st[sp++]=p[pc+1]|p[pc+2]<<8|p[pc+3]<<16|p[pc+4]<<24;break;}
      case 0x03:{if(sp<1)return end(2);sp--;break;}
      case 0x04:{if(sp<1)return end(2);if(sp>=256)return end(3);st[sp]=st[sp-1];sp++;break;}
      case 0x05:{if(sp<2)return end(2);const t=st[sp-1];st[sp-1]=st[sp-2];st[sp-2]=t;break;}
      case 0x06:{if(sp<2)return end(2);if(sp>=256)return end(3);st[sp]=st[sp-2];sp++;break;}
      case 0x07:{if(sp<3)return end(2);const a=st[sp-3],b=st[sp-2],c=st[sp-1];st[sp-3]=b;st[sp-2]=c;st[sp-1]=a;break;}
      case 0x10:case 0x11:case 0x12:case 0x13:case 0x14:case 0x15:case 0x16:case 0x18:case 0x19:case 0x1a:case 0x1c:case 0x1d:case 0x1e:case 0x20:case 0x21:case 0x22:{
        if(sp<2)return end(2);const b=st[--sp],a=st[sp-1];let r=0;
        if(op===0x10)r=(a+b)|0;
        else if(op===0x11)r=(a-b)|0;
        else if(op===0x12)r=Math.imul(a,b);
        else if(op===0x13){if(b===0)return end(4);r=(a/b)|0;}
        else if(op===0x14){if(b===0)return end(4);r=(a%b)|0;}
        else if(op===0x15){if(b===0)return end(4);r=((a>>>0)/(b>>>0))|0;}
        else if(op===0x16){if(b===0)return end(4);r=((a>>>0)%(b>>>0))|0;}
        else if(op===0x18)r=a&b;
        else if(op===0x19)r=a|b;
        else if(op===0x1a)r=a^b;
        else if(op===0x1c)r=a<<(b&31);
        else if(op===0x1d)r=a>>(b&31);
        else if(op===0x1e)r=(a>>>(b&31))|0;
        else if(op===0x20)r=a===b?1:0;
        else if(op===0x21)r=a<b?1:0;
        else r=(a>>>0)<(b>>>0)?1:0;
        st[sp-1]=r;break;}
      case 0x17:{if(sp<1)return end(2);st[sp-1]=(-st[sp-1])|0;break;}
      case 0x1b:{if(sp<1)return end(2);st[sp-1]=~st[sp-1];break;}
      case 0x30:{let o=p[pc+1]|p[pc+2]<<8;if(o&0x8000)o-=0x10000;pc=pc+3+o;continue;}
      case 0x31:{if(sp<1)return end(2);const v=st[--sp];let o=p[pc+1]|p[pc+2]<<8;if(o&0x8000)o-=0x10000;if(v===0){pc=pc+3+o;continue;}break;}
      case 0x32:{if(sp<1)return end(2);const v=st[--sp];let o=p[pc+1]|p[pc+2]<<8;if(o&0x8000)o-=0x10000;if(v!==0){pc=pc+3+o;continue;}break;}
      case 0x33:{if(cp>=64)return end(7);cs[cp++]=pc+3;pc=p[pc+1]|p[pc+2]<<8;continue;}
      case 0x34:{if(cp===0)return end(8);pc=cs[--cp];continue;}
      case 0x40:{if(sp<1)return end(2);const a=st[sp-1];if(a<0||a>255)return end(6);st[sp-1]=mem[a];break;}
      case 0x41:{if(sp<2)return end(2);const a=st[--sp],v=st[--sp];if(a<0||a>255)return end(6);mem[a]=v;break;}
      case 0x50:{if(sp<1)return end(2);const v=st[--sp],s=String(v);if(ol+s.length>65536)return end(11);for(let i=0;i<s.length;i++)out[ol++]=s.charCodeAt(i);break;}
      case 0x51:{if(sp<1)return end(2);const v=st[--sp];if(ol+1>65536)return end(11);out[ol++]=v&255;break;}
      case 0x52:{if(sp>=256)return end(3);st[sp++]=ip<inp.length?inp[ip++]:-1;break;}
      case 0x53:{if(sp<1)return end(2);const v=st[--sp];return end(v&255);}
      default:return end(5);
    }
    pc+=1+il;
  }
}
for(let i=1;i<=40;i++){
  const id='i'+String(i).padStart(3,'0');
  const p=readFileSync(IN+'/'+id+'/program.bin');
  let inp:Uint8Array;
  try{inp=readFileSync(IN+'/'+id+'/input.bin');}catch{inp=new Uint8Array(0);}
  const r=run(p,inp);
  mkdirSync(OUT+'/'+id,{recursive:true});
  writeFileSync(OUT+'/'+id+'/stdout.bin',r.o);
  writeFileSync(OUT+'/'+id+'/exit.txt',String(r.c)+'\n');
}
