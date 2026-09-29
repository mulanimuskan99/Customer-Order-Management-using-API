(function(){
  var KEY='com-orders-v1';
  var STATUSES=['Pending','Processing','Shipped','Delivered','Cancelled'];
  var COLS=[['id','Order'],['customer','Customer'],['product','Product'],['qty','Qty','num'],['total','Total','num'],['date','Date'],['status','Status']];
  var orders=[],sort={key:'date',dir:-1},editId=null;
  var $=function(id){return document.getElementById(id)};

  function seed(){
    return [
      {id:'ORD-1001',customer:'Aiko Tanaka',email:'aiko@example.com',product:'Mechanical keyboard',qty:1,price:89.5,status:'Delivered',date:'2026-09-02'},
      {id:'ORD-1002',customer:'Rohan Patil',email:'rohan@example.com',product:'USB-C hub',qty:2,price:34.99,status:'Shipped',date:'2026-09-12'},
      {id:'ORD-1003',customer:'Meera Kulkarni',email:'meera@example.com',product:'27 inch monitor',qty:1,price:219,status:'Processing',date:'2026-09-20'},
      {id:'ORD-1004',customer:'Kenji Sato',email:'kenji@example.com',product:'Laptop stand',qty:3,price:24,status:'Pending',date:'2026-09-25'},
      {id:'ORD-1005',customer:'Sara Khan',email:'sara@example.com',product:'Webcam',qty:1,price:59,status:'Cancelled',date:'2026-09-15'}
    ];
  }
  function load(){
    try{var raw=localStorage.getItem(KEY);if(raw){var a=JSON.parse(raw);if(Array.isArray(a))return a}}catch(e){}
    return seed();
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(orders))}catch(e){}}

  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function money(n){return '$'+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
  function total(o){return o.qty*o.price}
  function toast(m){var t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove('on')},1800)}
  function nextId(){var max=1000;orders.forEach(function(o){var n=parseInt(o.id.split('-')[1],10);if(n>max)max=n});return 'ORD-'+(max+1)}

  function visible(){
    var q=$('q').value.trim().toLowerCase(),f=$('f').value;
    var list=orders.filter(function(o){
      if(f&&o.status!==f)return false;
      return !q||(o.id+' '+o.customer+' '+o.email+' '+o.product).toLowerCase().indexOf(q)>-1;
    });
    list.sort(function(a,b){
      var x=sort.key==='total'?total(a):a[sort.key],y=sort.key==='total'?total(b):b[sort.key];
      return (x>y?1:x<y?-1:0)*sort.dir;
    });
    return list;
  }

  function renderStats(){
    var live=orders.filter(function(o){return o.status!=='Cancelled'});
    var rev=live.reduce(function(s,o){return s+total(o)},0);
    var open=orders.filter(function(o){return o.status==='Pending'||o.status==='Processing'}).length;
    $('stats').innerHTML=
      '<div class="stat"><b>'+orders.length+'</b><span>Total orders</span></div>'+
      '<div class="stat"><b>'+open+'</b><span>Open orders</span></div>'+
      '<div class="stat"><b>'+money(rev)+'</b><span>Revenue (excluding cancelled)</span></div>'+
      '<div class="stat"><b>'+money(live.length?rev/live.length:0)+'</b><span>Average order value</span></div>';
  }

  function renderHead(){
    $('head').innerHTML=COLS.map(function(c){
      var arrow=sort.key===c[0]?(sort.dir>0?' ▲':' ▼'):'';
      return '<th class="'+(c[2]||'')+'" data-k="'+c[0]+'" tabindex="0" aria-sort="'+(sort.key===c[0]?(sort.dir>0?'ascending':'descending'):'none')+'">'+c[1]+arrow+'</th>';
    }).join('')+'<th></th>';
  }

  function render(){
    renderStats();renderHead();
    var list=visible();
    $('empty').hidden=list.length>0;
    $('rows').innerHTML=list.map(function(o){
      var opts=STATUSES.map(function(s){return '<option'+(s===o.status?' selected':'')+'>'+s+'</option>'}).join('');
      return '<tr data-id="'+esc(o.id)+'">'+
        '<td>'+esc(o.id)+'</td>'+
        '<td class="who">'+esc(o.customer)+'<small>'+esc(o.email)+'</small></td>'+
        '<td>'+esc(o.product)+'</td>'+
        '<td class="num">'+o.qty+'</td>'+
        '<td class="num">'+money(total(o))+'</td>'+
        '<td>'+esc(o.date)+'</td>'+
        '<td><select class="st" data-act="status" aria-label="Status for '+esc(o.id)+'" style="color:var(--s-'+o.status.toLowerCase()+')">'+opts+'</select></td>'+
        '<td class="num"><button class="link" data-act="edit">Edit</button><button class="link del" data-act="del">Delete</button></td></tr>';
    }).join('');
  }

  function fillStatusSelects(){
    var o=STATUSES.map(function(s){return '<option>'+s+'</option>'}).join('');
    $('fStatus').innerHTML=o;
    $('f').insertAdjacentHTML('beforeend',o);
  }

  function openForm(order){
    editId=order?order.id:null;
    $('dlgTitle').textContent=order?'Edit '+order.id:'Add order';
    $('err').textContent='';
    $('fName').value=order?order.customer:'';
    $('fEmail').value=order?order.email:'';
    $('fProd').value=order?order.product:'';
    $('fQty').value=order?order.qty:1;
    $('fPrice').value=order?order.price:'';
    $('fStatus').value=order?order.status:'Pending';
    $('fDate').value=order?order.date:new Date().toISOString().slice(0,10);
    $('dlg').showModal();
    $('fName').focus();
  }

  function submitForm(e){
    e.preventDefault();
    var name=$('fName').value.trim(),email=$('fEmail').value.trim(),prod=$('fProd').value.trim();
    var qty=parseInt($('fQty').value,10),price=parseFloat($('fPrice').value),date=$('fDate').value;
    var msg='';
    if(!name)msg='Enter the customer name.';
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))msg='Enter a valid email address.';
    else if(!prod)msg='Enter the product name.';
    else if(!(qty>=1))msg='Quantity must be at least 1.';
    else if(!(price>=0))msg='Enter a unit price of 0 or more.';
    else if(!date)msg='Pick an order date.';
    if(msg){$('err').textContent=msg;return}
    var data={customer:name,email:email,product:prod,qty:qty,price:price,status:$('fStatus').value,date:date};
    if(editId){
      orders=orders.map(function(o){return o.id===editId?Object.assign({},o,data):o});
      toast(editId+' saved');
    }else{
      var id=nextId();orders.push(Object.assign({id:id},data));toast(id+' added');
    }
    persist();$('dlg').close();render();
  }

  $('addBtn').onclick=function(){openForm(null)};
  $('cancel').onclick=function(){$('dlg').close()};
  $('form').addEventListener('submit',submitForm);
  $('q').oninput=render;$('f').onchange=render;

  $('head').addEventListener('click',function(e){
    var th=e.target.closest('th[data-k]');if(!th)return;
    var k=th.dataset.k;
    sort=sort.key===k?{key:k,dir:-sort.dir}:{key:k,dir:1};
    render();
  });
  $('head').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();e.target.click()}});

  $('rows').addEventListener('click',function(e){
    var b=e.target.closest('button[data-act]');if(!b)return;
    var id=b.closest('tr').dataset.id;
    var o=orders.filter(function(x){return x.id===id})[0];
    if(b.dataset.act==='edit')openForm(o);
    if(b.dataset.act==='del'&&confirm('Delete '+id+' for '+o.customer+'? This cannot be undone.')){
      orders=orders.filter(function(x){return x.id!==id});persist();render();toast(id+' deleted');
    }
  });
  $('rows').addEventListener('change',function(e){
    if(e.target.dataset.act!=='status')return;
    var id=e.target.closest('tr').dataset.id;
    orders=orders.map(function(o){return o.id===id?Object.assign({},o,{status:e.target.value}):o});
    persist();render();toast(id+' is now '+e.target.value);
  });

  fillStatusSelects();
  orders=load();
  render();
})();
