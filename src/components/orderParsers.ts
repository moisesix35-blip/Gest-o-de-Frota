export type ParsedItem = {codigo:string;descricao:string;cor:string;quantidade:string;unitario:string};
export type ParsedOrder = {numero:string;cliente:string;documento:string;representante:string;uf:string;data:string;valor:string;itens:ParsedItem[]};
const money = (s:string) => s.replace(/\./g,"").replace(",",".");
const field = (s:string,re:RegExp) => s.match(re)?.[1]?.trim() || "";
const colors = ["PRETO","PRETA","BRANCO","BRANCA","LILAS","LILÁS","VINHO","AZUL","VERDE","VERMELHO","VERMELHA","AMARELO","AMARELA","BEGE","CINZA","ROSA","MARROM","NATURAL","TRANSPARENTE","LARANJA"];
function splitColor(desc:string) {
 const found=colors.find(c=>new RegExp("\\b"+c+"\\b","i").test(desc));
 return {descricao:desc.trim(),cor:found||""};
}
function adriana(text:string):ParsedOrder {
 const lines=text.split(/\n/).map(s=>s.trim()).filter(Boolean);
 const get=(re:RegExp)=>field(text,re);
 const start=lines.findIndex(s=>/^#\s*C[oó]digo\s+Produto/i.test(s));
 const end=lines.findIndex((s,i)=>i>start && /Valor do frete|Valor total:/i.test(s));
 const body=lines.slice(start>=0?start+1:0,end>start?end:undefined);
 const itens:ParsedItem[]=[];
 let pending:string[]=[];
 const row=/^\d+\s+(\d{5,})\s+(.*?)\s+(\d+(?:[.,]\d+)?)\s+R\$\s*([\d.,]+)\s+(?:-----|[\d.,% -]+)?\s*R\$\s*([\d.,]+)\s+R\$\s*([\d.,]+)/i;
 for(let i=0;i<body.length;i++){
  const line=body[i];
  const m=line.match(row);
  if(m){
   const previous=pending.join(" ");
   pending=[];
   const next:string[]=[];
   while(i+1<body.length && !/^\d+\s+\d{5,}\b/.test(body[i+1]) && !/^(?:Valor|Condi[cç][aã]o)/i.test(body[i+1])) next.push(body[++i]);
   const description=[previous,m[2],...next].filter(Boolean).join(" ").replace(/\s+/g," ").trim();
   const d=splitColor(description);
   itens.push({codigo:m[1],descricao:d.descricao,cor:d.cor,quantidade:m[3].replace(",","."),unitario:money(m[5])});
  }else if(!/^\d+\s+\d{5,}\b/.test(line)) pending.push(line);
 }
 const date=get(/Data de Emiss[aã]o:\s*(?:\n|\s)+(\d{2}\/\d{2}\/\d{4})/i);
 const state=get(/Estado:\s*([^\n]+)/i);
 const states:Record<string,string>={"ceará":"CE","ceara":"CE","rio grande do norte":"RN","paraíba":"PB","paraiba":"PB","pernambuco":"PE","piauí":"PI","piaui":"PI","bahia":"BA","maranhão":"MA","maranhao":"MA"};
 return {
  numero:get(/Or[çc]amento\s*N[º°o.]?\s*(\d+)/i),
  cliente:get(/Cliente:\s*(.*?)(?=\s{2,}Nome Fantasia:|\n)/i),
  documento:get(/CNPJ:\s*([\d./-]+)/i),
  representante:get(/Vendedor:\s*([^\n]+)/i)||get(/^(.+?)\s+Representa[çc][oõ]es/m),
  uf:states[state.toLowerCase()]||(/^[A-Z]{2}$/.test(state)?state:""),
  data:date?date.split("/").reverse().join("-"):"",
  valor:money(get(/Valor total:\s*R\$\s*([\d.,]+)/i)),
  itens
 };
}

function fkn(text:string):ParsedOrder {
 const get=(re:RegExp)=>field(text,re);
 const items:ParsedItem[]=[];
 const lines=text.split(/\n/);
 const row=/^\s*(\d{5,}\.\d+)\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s*$/;
 for(const line of lines) {
  const m=line.match(row);
  if(!m)continue;
  const d=splitColor(m[2]);
  items.push({codigo:m[1],descricao:d.descricao,cor:d.cor,quantidade:m[3],unitario:money(m[4])});
 }
 const date=get(/\bNRO:\s*\d+\s+DATA:\s*(\d{2}\/\d{2}\/\d{4})/i);
 return {
  numero:get(/\bNRO:\s*(\d{3,})/i),
  cliente:get(/CLIENTE\.:\s*(.*?)(?=\s{2,}\/\d+|\n)/i),
  documento:get(/CNPJ\.+:\s*([\d./-]+)/i),
  representante:get(/VENDEDOR\.+:\s*\d+\s+([^/\n]+)/i),
  uf:get(/CIDADE\.+:[^\n]*?ESTADO:\s*([A-Z]{2})/i),
  data:date?date.split("/").reverse().join("-"):"",
  valor:money(get(/TOTAL GERAL:\s*([\d.,]+)/i)),
  itens:items
 };
}

export function parseRepresentativeOrder(text:string):{order:ParsedOrder;template:string;warnings:string[]} {
 const template=/C[ÓO]PIA DE PEDIDO/i.test(text)&&/\bNRO:\s*\d+/i.test(text)?"fkn-v1":/Adriana Representa[çc][oõ]es/i.test(text)&&/Or[çc]amento\s*N/i.test(text)?"adriana-v1":"generic";
 const order=template==="fkn-v1"?fkn(text):template==="adriana-v1"?adriana(text):generic(text);
 const warnings:string[]=[];
 if(!order.numero)warnings.push("Número do pedido não identificado.");
 if(!order.cliente)warnings.push("Cliente não identificado.");
 if(!order.itens.length)warnings.push("Itens não identificados. Confira e preencha manualmente.");
 if(template==="generic")warnings.push("Modelo de representante ainda não mapeado. Extração parcial; revise todos os campos.");
 return {order,template,warnings};
}
function generic(text:string):ParsedOrder {
 const get=(re:RegExp)=>field(text,re);
 const date=get(/(?:Data de Emiss[aã]o|Emiss[aã]o)\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
 return {numero:get(/(?:Or[çc]amento|Pedido)\s*(?:N[º°o.]?)?\s*[:#-]?\s*(\d{3,})/i),cliente:get(/Cliente:\s*([^\n]+)/i),documento:get(/(?:CNPJ|CPF):\s*([\d./-]+)/i),representante:get(/(?:Vendedor|Representante):\s*([^\n]+)/i),uf:get(/UF:\s*([A-Z]{2})/i),data:date?date.split("/").reverse().join("-"):"",valor:money(get(/Valor total:\s*(?:R\$)?\s*([\d.,]+)/i)),itens:[]};
}
