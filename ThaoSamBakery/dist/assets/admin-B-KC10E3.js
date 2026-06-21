import"./modulepreload-polyfill-B5Qt9EMX.js";let l="",d="",p="main",b=null,r=[],c=[],v=null,y=null,m=[],h="",g="all";const n=e=>document.getElementById(e);document.addEventListener("DOMContentLoaded",()=>{j(),l&&d&&$(!0)});function j(){l=localStorage.getItem("__thaosam_git_token")||"",d=localStorage.getItem("__thaosam_git_repo")||"",p=localStorage.getItem("__thaosam_git_branch")||"main",n("gitToken").value=l,n("gitRepo").value=d,n("gitBranch").value=p}function H(){l=n("gitToken").value.trim(),d=n("gitRepo").value.trim(),p=n("gitBranch").value.trim()||"main",localStorage.setItem("__thaosam_git_token",l),localStorage.setItem("__thaosam_git_repo",d),localStorage.setItem("__thaosam_git_branch",p)}async function $(e=!1){if(H(),!l||!d){e||s("Vui lòng điền đầy đủ Token và Repository!");return}e||s("Đang tải dữ liệu từ GitHub...");try{const t=await fetch(`https://api.github.com/repos/${d}/contents/products.js?ref=${p}`,{headers:{Authorization:`token ${l}`,Accept:"application/vnd.github.v3+json"}});if(!t.ok)throw new Error(`GitHub trả về mã lỗi: ${t.status}`);const i=await t.json();b=i.sha;const o=R(i.content),a=new Blob([o],{type:"application/javascript"}),u=URL.createObjectURL(a),k=await import(u);r=[...k.CATEGORIES||[]],c=[...k.PRODUCTS||[]],URL.revokeObjectURL(u),n("connectionStatus").className="sb-info connected",n("connectionStatus").querySelector(".status-text").textContent="Đã kết nối GitHub",n("connectAlert").style.display="none",n("editorSection").style.display="block",n("btnReload").disabled=!1,n("btnSave").disabled=!1;const F=document.querySelector(".sidebar");F&&window.innerWidth<=768&&F.classList.add("collapsed"),s("Kết nối thành công! Đã tải danh sách sản phẩm."),x(),S(),C(),f(),T()}catch(t){console.error(t),n("connectionStatus").className="sb-info",n("connectionStatus").querySelector(".status-text").textContent="Lỗi kết nối",e||s("Lỗi: Không thể kết nối hoặc tải file từ GitHub!")}}function U(){$(!1)}async function N(){if(!l||!d||!b){s("Chưa kết nối hoặc thiếu thông tin GitHub!");return}s("Đang đồng bộ dữ liệu lên GitHub...");try{const e=await fetch(`https://api.github.com/repos/${d}/contents/products.js?ref=${p}`,{headers:{Authorization:`token ${l}`,Accept:"application/vnd.github.v3+json"}});e.ok&&(b=(await e.json()).sha);const t=`export const CATEGORIES = ${JSON.stringify(r,null,2)};

export const PRODUCTS = ${JSON.stringify(c,null,2)};
`,i=D(t),o=await fetch(`https://api.github.com/repos/${d}/contents/products.js`,{method:"PUT",headers:{Authorization:`token ${l}`,Accept:"application/vnd.github.v3+json","Content-Type":"application/json"},body:JSON.stringify({message:"admin: cập nhật danh sách thực đơn sản phẩm & danh mục",content:i,sha:b,branch:p})});if(!o.ok)throw new Error(`Không thể đẩy thay đổi lên GitHub: ${o.status}`);b=(await o.json()).content.sha,s("Chúc mừng! Đã lưu thành công và cập nhật lên GitHub.")}catch(e){console.error(e),s("Lỗi đồng bộ: "+e.message)}}function R(e){e=e.replace(/\s/g,"");const t=atob(e),i=new Uint8Array(t.length);for(let o=0;o<t.length;o++)i[o]=t.charCodeAt(o);return new TextDecoder("utf-8").decode(i)}function D(e){const t=new TextEncoder().encode(e);let i="";const o=t.byteLength;for(let a=0;a<o;a++)i+=String.fromCharCode(t[a]);return btoa(i)}function O(e){const t=e.target.files[0];if(!t)return;const i=new FileReader;i.onload=function(o){h=o.target.result,n("prodImgUrl").value="",n("imgPreview").src=h,n("imgPreview").style.display="block",n("imgPlaceholder").style.display="none"},i.readAsDataURL(t)}function A(){const e=n("prodImgUrl").value.trim();e?(h=e,n("imageFile").value="",n("imgPreview").src=e,n("imgPreview").style.display="block",n("imgPlaceholder").style.display="none"):_()}function _(){h="",n("imgPreview").src="",n("imgPreview").style.display="none",n("imgPlaceholder").style.display="block"}function B(e){const t=n("tabBtnProducts"),i=n("tabBtnCategories"),o=n("productsTabContent"),a=n("categoriesTabContent");e==="products"?(t.classList.add("active"),i.classList.remove("active"),o.style.display="grid",a.style.display="none",f()):(t.classList.remove("active"),i.classList.add("active"),o.style.display="none",a.style.display="grid",T())}function x(){const e=n("prodCat");e&&(e.innerHTML=r.map(t=>`
    <option value="${t.id}">${t.name}</option>
  `).join(""))}function C(){const e=n("prodCat").value,t=n("sizesPreviewList");if(!t)return;const i=r.find(a=>a.id===e),o=i?i.sizes||[]:[];if(o.length===0){t.innerHTML='<div style="font-size:12px;color:var(--text-muted);">Không có kích cỡ nào được cấu hình cho danh mục này.</div>';return}t.innerHTML=o.map(a=>`
    <div class="size-preview-item">
      <span>Cỡ: <strong>${a.label}</strong></span>
      <span>Giá: <strong>${P(a.price)}</strong></span>
    </div>
  `).join("")}function G(e){e.preventDefault();const t=n("prodName").value.trim(),i=n("prodCat").value,o=n("prodDesc").value.trim();if(!t){s("Vui lòng nhập tên sản phẩm!");return}if(!h){s("Vui lòng tải lên hoặc chọn URL hình ảnh!");return}if(v){const a=c.find(u=>u.id===v);a&&(a.name=t,a.cat=i,a.desc=o,a.img=h,s(`Đã cập nhật: ${t}`))}else{const a=E();c.push({id:a,cat:i,name:t,desc:o,img:h}),s(`Đã thêm món mới: ${t}`)}L(),f()}function E(){if(c.length===0)return"C001";const e=c.map(i=>{const o=parseInt(i.id.replace(/[A-Za-z]/g,""));return isNaN(o)?0:o});return"C"+(Math.max(...e)+1).toString().padStart(3,"0")}function L(){v=null,h="",n("prodId").value="",n("prodName").value="",n("prodDesc").value="",n("prodImgUrl").value="",n("imageFile").value="",n("prodCat").options.length>0&&(n("prodCat").selectedIndex=0),n("formTitle").textContent="Thêm sản phẩm mới",n("btnSubmitForm").textContent="Thêm sản phẩm",n("btnCancelEdit").style.display="none",_(),C()}function M(e){const t=c.find(i=>i.id===e);t&&(v=e,n("prodId").value=t.id,n("prodName").value=t.name,n("prodDesc").value=t.desc||"",n("prodCat").value=t.cat,h=t.img,t.img.startsWith("data:")?(n("prodImgUrl").value="",n("imgPreview").src=t.img):(n("prodImgUrl").value=t.img,n("imgPreview").src=t.img),n("imgPreview").style.display="block",n("imgPlaceholder").style.display="none",n("formTitle").textContent=`Chỉnh sửa: ${t.name}`,n("btnSubmitForm").textContent="Cập nhật sản phẩm",n("btnCancelEdit").style.display="inline-flex",C(),n("productForm").scrollIntoView({behavior:"smooth"}))}function V(e){const t=c.find(i=>i.id===e);t&&confirm(`Bạn chắc chắn muốn xóa món: ${t.name}? (Nhấn Lưu sau đó để đẩy lên GitHub)`)&&(c=c.filter(i=>i.id!==e),s(`Đã xóa món: ${t.name}`),v===e&&L(),f())}function w(){const e=n("tempSizesList");if(e){if(m.length===0){e.innerHTML='<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">Chưa thêm kích cỡ nào.</div>';return}e.innerHTML=m.map((t,i)=>`
    <div class="temp-size-badge">
      <span>${t.label} (${P(t.price)})</span>
      <button type="button" class="btn-remove-size" onclick="removeSizeFromTempList(${i})">&times;</button>
    </div>
  `).join("")}}function K(){const e=n("newSizeLabel"),t=n("newSizePrice"),i=e.value.trim(),o=t.value.trim();if(!i||!o){s("Vui lòng điền nhãn và giá cho kích cỡ!");return}const a=parseInt(o);if(isNaN(a)||a<0){s("Giá không hợp lệ!");return}if(m.some(u=>u.label.toLowerCase()===i.toLowerCase())){s("Cỡ này đã được thêm!");return}m.push({label:i,price:a}),e.value="",t.value="",w()}function q(e){m.splice(e,1),w()}function T(){const e=n("categoriesTableBody");if(e){if(r.length===0){e.innerHTML=`
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px 0;">
          Chưa có danh mục nào.
        </td>
      </tr>
    `;return}e.innerHTML=r.map(t=>{const i=t.sizes&&t.sizes.length>0?t.sizes.map(o=>`${o.label}: <strong>${P(o.price)}</strong>`).join(", "):"<em style='color:var(--text-muted)'>Chưa có cỡ</em>";return`
      <tr>
        <td>
          <small style="color: var(--text-muted); font-family: 'Outfit'; font-weight: 600;">${t.id}</small>
        </td>
        <td>
          <span class="t-name">${t.name}</span>
        </td>
        <td>
          <span style="font-size: 13px;">${i}</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-edit-icon" onclick="editCategory('${t.id}')" title="Chỉnh sửa">
              ✏️
            </button>
            <button class="btn-icon btn-delete-icon" onclick="deleteCategory('${t.id}')" title="Xóa">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `}).join("")}}function J(e){e.preventDefault();const t=n("catName").value.trim();if(!t){s("Vui lòng nhập tên danh mục!");return}if(m.length===0){s("Danh mục phải có ít nhất 1 kích cỡ!");return}if(y){const i=r.find(o=>o.id===y);i&&(i.name=t,i.sizes=[...m],s(`Đã cập nhật danh mục: ${t}`))}else{const i=X();r.push({id:i,name:t,sizes:[...m]}),s(`Đã thêm danh mục mới: ${t}`)}I(),x(),S(),T()}function X(){if(r.length===0)return"cake1";const e=r.map(i=>{const o=parseInt(i.id.replace("cake",""));return isNaN(o)?0:o});return"cake"+(Math.max(...e)+1)}function I(){y=null,m=[],n("catId").value="",n("catName").value="",n("newSizeLabel").value="",n("newSizePrice").value="",n("catFormTitle").textContent="Thêm danh mục mới",n("btnSubmitCatForm").textContent="Thêm danh mục",n("btnCancelCatEdit").style.display="none",w()}function W(e){const t=r.find(i=>i.id===e);t&&(y=e,m=[...t.sizes||[]],n("catId").value=t.id,n("catName").value=t.name,n("catFormTitle").textContent=`Chỉnh sửa: ${t.name}`,n("btnSubmitCatForm").textContent="Cập nhật danh mục",n("btnCancelCatEdit").style.display="inline-flex",w(),n("categoryForm").scrollIntoView({behavior:"smooth"}))}function Z(e){const t=r.find(a=>a.id===e);if(!t)return;const i=c.filter(a=>a.cat===e).length,o=i>0?`Cảnh báo: Danh mục "${t.name}" đang có ${i} sản phẩm. Xóa danh mục này sẽ xóa tất cả sản phẩm thuộc về nó. Bạn chắc chắn chứ?`:`Bạn chắc chắn muốn xóa danh mục: ${t.name}?`;confirm(o)&&(r=r.filter(a=>a.id!==e),c=c.filter(a=>a.cat!==e),s(`Đã xóa danh mục: ${t.name}`),y===e&&I(),g===e&&(g="all"),x(),S(),f(),T())}function S(){const e=n("tabFilters");if(!e)return;const t=[{id:"all",name:"Tất cả"},...r.map(i=>({id:i.id,name:i.name}))];e.innerHTML=t.map(i=>`
    <button class="tab-filter-btn ${i.id===g?"active":""}" 
            onclick="setFilterTab('${i.id}')">
      ${i.name}
    </button>
  `).join("")}function Q(e){g=e,S(),f()}function f(){const e=n("productsTableBody");if(!e)return;const t=c.filter(i=>g==="all"||i.cat===g);if(t.length===0){e.innerHTML=`
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px 0;">
          Chưa có sản phẩm nào thuộc danh mục này.
        </td>
      </tr>
    `;return}e.innerHTML=t.map(i=>{const o=r.find(u=>u.id===i.cat),a=o&&o.name.split(" ").slice(1).join(" ")||"Món";return`
      <tr>
        <td>
          <div class="t-img-box">
            <img src="${i.img}" alt="${i.name}">
          </div>
        </td>
        <td>
          <span class="t-name">${i.name}</span><br>
          <small style="color: var(--text-muted); font-family: 'Outfit';">${i.id}</small>
        </td>
        <td>
          <span class="t-badge">${a}</span>
        </td>
        <td>
          <div class="t-desc" title="${i.desc||""}">${i.desc||"Không có mô tả"}</div>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-edit-icon" onclick="editProduct('${i.id}')" title="Chỉnh sửa">
              ✏️
            </button>
            <button class="btn-icon btn-delete-icon" onclick="deleteProduct('${i.id}')" title="Xóa">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `}).join("")}function P(e){return e.toLocaleString("vi-VN")+"đ"}let z;function s(e){const t=n("toast");t&&(t.textContent=e,t.classList.add("show"),clearTimeout(z),z=setTimeout(()=>{t.classList.remove("show")},3500))}function Y(){const e=document.querySelector(".sidebar");e&&e.classList.toggle("collapsed")}window.connectGitHub=$;window.reloadProducts=U;window.saveChanges=N;window.handleImageFile=O;window.handleImageUrlInput=A;window.handleCategoryChange=C;window.handleFormSubmit=G;window.resetForm=L;window.editProduct=M;window.deleteProduct=V;window.setFilterTab=Q;window.toggleSidebarConfig=Y;window.switchAdminTab=B;window.addSizeToTempList=K;window.removeSizeFromTempList=q;window.handleCategoryFormSubmit=J;window.resetCategoryForm=I;window.editCategory=W;window.deleteCategory=Z;
