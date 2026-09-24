document.addEventListener("DOMContentLoaded", () => {

const ADMIN_API = "https://lurelle-server.onrender.com/api/products"
const cloudName = "dbhdmnxlx"
const uploadPreset = "athelonImages"

const tabs = document.querySelectorAll(".tab-btn")
const addFormPanel = document.getElementById("addForm")
const deleteFormPanel = document.getElementById("deleteForm")
const addFormEl = document.getElementById("addFormEl")
const deleteFormEl = document.getElementById("deleteFormEl")
const productsList = document.getElementById("productsList")
const editModal = document.getElementById("editModal")
const editForm = document.getElementById("modalEditForm")
const successModal = document.getElementById("successModal")
const closeSuccessBtn = document.getElementById("closeSuccess")
const closeEditBtn = document.getElementById("closeEdit")
const closeEditBtn2 = document.getElementById("closeEdit2")
const addImageBtn = document.getElementById("addImageBtn")
const addImageInput = document.getElementById("addImageInput")
const editImageBtn = document.getElementById("editImageBtn")
const editImageInput = document.getElementById("editImageInput")
const addLinks = document.getElementById("addImagesLinks")
const editLinks = document.getElementById("editImagesLinks")
const addDescription = document.getElementById("addDescription")
const editDescription = document.getElementById("editDescription")
const addBrBtn = document.getElementById("addBrBtn")
const editBrBtn = document.getElementById("editBrBtn")
const copyFromId = document.getElementById("copyFromId")
const copyProductBtn = document.getElementById("copyProductBtn")

const addCategorySelect = document.getElementById("addCategorySelect")
const addCategoryNew = document.getElementById("addCategoryNew")
const addBrandSelect = document.getElementById("addBrandSelect")
const addBrandNew = document.getElementById("addBrandNew")
const editCategorySelect = document.getElementById("editCategorySelect")
const editCategoryNew = document.getElementById("editCategoryNew")
const editBrandSelect = document.getElementById("editBrandSelect")
const editBrandNew = document.getElementById("editBrandNew")

const addImages = []
const editImages = []
let allProducts = []

function showSuccess() { successModal.style.display = "flex" }

function insertBr(textarea) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  textarea.value = value.slice(0, start) + "<br>" + value.slice(end)
  const pos = start + 4
  textarea.focus()
  textarea.setSelectionRange(pos, pos)
}

addBrBtn.onclick = () => insertBr(addDescription)
editBrBtn.onclick = () => insertBr(editDescription)

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json()
}

closeSuccessBtn.onclick = () => { successModal.style.display = "none" }
closeEditBtn.onclick = () => { editModal.style.display = "none" }
if (closeEditBtn2) closeEditBtn2.onclick = () => { editModal.style.display = "none" }

tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"))
    tab.classList.add("active")
    addFormPanel.style.display = "none"
    deleteFormPanel.style.display = "none"
    if (tab.dataset.tab === "add") addFormPanel.style.display = "block"
    else if (tab.dataset.tab === "delete") deleteFormPanel.style.display = "block"
  }
})

function fillSelectWithOptions(selectEl, newInputEl, values, selectedValue) {
  const unique = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "uk"))
  selectEl.innerHTML =
    `<option value="">— Оберіть —</option>` +
    unique.map(v => `<option value="${v}">${v}</option>`).join("") +
    `<option value="__new__">+ Додати нову</option>`

  if (selectedValue && unique.includes(selectedValue)) {
    selectEl.value = selectedValue
    newInputEl.style.display = "none"
    newInputEl.value = ""
  } else if (selectedValue) {
    selectEl.value = "__new__"
    newInputEl.style.display = "inline-block"
    newInputEl.value = selectedValue
  } else {
    selectEl.value = ""
    newInputEl.style.display = "none"
    newInputEl.value = ""
  }
}

function bindSelectToggle(selectEl, newInputEl) {
  selectEl.onchange = () => {
    if (selectEl.value === "__new__") {
      newInputEl.style.display = "inline-block"
      newInputEl.value = ""
      newInputEl.focus()
    } else {
      newInputEl.style.display = "none"
      newInputEl.value = ""
    }
  }
}

function getSelectValue(selectEl, newInputEl) {
  if (selectEl.value === "__new__") return newInputEl.value.trim()
  return selectEl.value
}

function refreshCategoryBrandOptions() {
  const categories = allProducts.map(p => p.category)
  const brands = allProducts.map(p => p.brand)
  fillSelectWithOptions(addCategorySelect, addCategoryNew, categories, addCategorySelect.value === "__new__" ? "" : addCategorySelect.value)
  fillSelectWithOptions(addBrandSelect, addBrandNew, brands, addBrandSelect.value === "__new__" ? "" : addBrandSelect.value)
}

bindSelectToggle(addCategorySelect, addCategoryNew)
bindSelectToggle(addBrandSelect, addBrandNew)
bindSelectToggle(editCategorySelect, editCategoryNew)
bindSelectToggle(editBrandSelect, editBrandNew)

copyProductBtn.onclick = () => {
  const idVal = copyFromId.value.trim()
  if (!idVal) { alert("Введіть ID товару для копіювання"); return }
  const source = allProducts.find(p => String(p.id) === idVal)
  if (!source) { alert("Товар з таким ID не знайдено"); return }

  const fields = ["name", "color", "oldPrice", "newPrice", "rating", "inStock", "material", "dimensions", "description"]
  fields.forEach(k => {
    const el = addFormEl.querySelector(`[name="${k}"]`)
    if (el) el.value = source[k] ?? ""
  })

  const availableEl = addFormEl.querySelector('[name="available"]')
  if (availableEl) availableEl.value = source.available ? "true" : "false"

  const isNewEl = addFormEl.querySelector('[name="isNew"]')
  if (isNewEl) isNewEl.value = source.isNew ? "true" : "false"

  const categories = allProducts.map(p => p.category)
  const brands = allProducts.map(p => p.brand)
  fillSelectWithOptions(addCategorySelect, addCategoryNew, categories, source.category || "")
  fillSelectWithOptions(addBrandSelect, addBrandNew, brands, source.brand || "")

  copyFromId.value = ""
}

async function uploadToCloudinary(file) {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("upload_preset", uploadPreset)
  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd })
  const data = await r.json()
  if (!data.secure_url) throw new Error("Cloudinary upload failed")
  return data.secure_url
}

function renderLinks(arr, container) {
  container.innerHTML = ""
  arr.forEach((url, i) => {
    const d = document.createElement("div")
    d.innerHTML = `<img src="${url}"><button type="button">✕</button>`
    d.querySelector("button").onclick = () => { arr.splice(i, 1); renderLinks(arr, container) }
    container.appendChild(d)
  })
}

async function uploadManyAndPush(filesList, targetArr, container, btn) {
  const files = Array.from(filesList || [])
  if (!files.length) return
  btn.disabled = true
  const originalText = btn.textContent
  btn.textContent = `0/${files.length}...`
  try {
    let done = 0
    for (const file of files) {
      const url = await uploadToCloudinary(file)
      targetArr.push(url)
      done++
      btn.textContent = `${done}/${files.length}...`
      renderLinks(targetArr, container)
    }
  } catch (err) {
    alert("Помилка завантаження фото: " + err.message)
  } finally {
    btn.disabled = false
    btn.textContent = originalText
  }
}

addImageBtn.onclick = () => uploadManyAndPush(addImageInput.files, addImages, addLinks, addImageBtn)
editImageBtn.onclick = () => uploadManyAndPush(editImageInput.files, editImages, editLinks, editImageBtn)

async function loadProducts() {
  try {
    allProducts = await apiFetch(ADMIN_API)
    renderProducts(allProducts)
    refreshCategoryBrandOptions()
  } catch (err) {
    productsList.innerHTML = `<p style="color:var(--danger)">Помилка: ${err.message}</p>`
  }
}

function renderProducts(products) {
  productsList.innerHTML = ""
  products.forEach(p => {
    const d = document.createElement("div")
    d.className = "product-card"
    const hasImg = p.images?.[0]
    d.innerHTML = `
      ${hasImg
        ? `<img class="product-card-img" src="${p.images[0]}" alt="${p.name}">`
        : `<div class="product-card-img-placeholder">👜</div>`
      }
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-meta">
          <span class="product-card-id">ID: ${p.id}</span>
          <span class="product-card-price">${Number(p.newPrice).toLocaleString("uk-UA")} грн</span>
        </div>
        <div class="product-card-badges">
          <span class="badge ${Number(p.inStock) > 0 ? "badge-stock" : "badge-oos"}">${Number(p.inStock) > 0 ? `✓ ${p.inStock} шт.` : "Немає"}</span>
          ${p.isNew ? `<span class="badge badge-new">NEW</span>` : ""}
        </div>
      </div>
      <button class="product-card-edit">✏️ Редагувати</button>
    `
    d.querySelector(".product-card-edit").onclick = () => openEdit(p)
    productsList.appendChild(d)
  })
}

addFormEl.onsubmit = async e => {
  e.preventDefault()
  const data = new FormData(e.target)
  const category = getSelectValue(addCategorySelect, addCategoryNew)
  const brand = getSelectValue(addBrandSelect, addBrandNew)
  if (!category) { alert("Оберіть або введіть категорію"); return }
  if (!brand) { alert("Оберіть або введіть бренд"); return }
  const lastId = allProducts.length > 0 ? Math.max(...allProducts.map(p => Number(p.id) || 0)) : 0
  const newId = lastId + 1
  try {
    await apiFetch(ADMIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newId,
        name: data.get("name"),
        color: data.get("color"),
        description: data.get("description"),
        oldPrice: +data.get("oldPrice"),
        newPrice: +data.get("newPrice"),
        material: data.get("material"),
        dimensions: data.get("dimensions"),
        rating: +data.get("rating"),
        category,
        brand,
        images: [...addImages],
        inStock: +data.get("inStock"),
        available: data.get("available") === "true",
        isNew: data.get("isNew") === "true"
      })
    })
    addImages.length = 0
    addLinks.innerHTML = ""
    e.target.reset()
    addCategorySelect.value = ""
    addCategoryNew.style.display = "none"
    addBrandSelect.value = ""
    addBrandNew.style.display = "none"
    showSuccess()
    loadProducts()
  } catch (err) {
    alert("Помилка додавання: " + err.message)
  }
}

deleteFormEl.onsubmit = async e => {
  e.preventDefault()
  const data = new FormData(e.target)
  const id = +data.get("id")
  if (!id) return
  try {
    await apiFetch(`${ADMIN_API}/${id}`, { method: "DELETE" })
    e.target.reset()
    showSuccess()
    loadProducts()
  } catch (err) {
    alert("Помилка видалення: " + err.message)
  }
}

function openEdit(p) {
  editModal.style.display = "flex"
  editImages.length = 0
  editImages.push(...(p.images || []))

  const fields = ["id", "name", "color", "description", "oldPrice", "newPrice", "rating", "inStock", "material", "dimensions"]
  fields.forEach(k => {
    const el = editForm.querySelector(`[name="${k}"]`)
    if (el) el.value = p[k] ?? ""
  })

  const categories = allProducts.map(prod => prod.category)
  const brands = allProducts.map(prod => prod.brand)
  fillSelectWithOptions(editCategorySelect, editCategoryNew, categories, p.category || "")
  fillSelectWithOptions(editBrandSelect, editBrandNew, brands, p.brand || "")

  const availableEl = editForm.querySelector('[name="available"]')
  if (availableEl) availableEl.value = p.available ? "true" : "false"

  const isNewEl = editForm.querySelector('[name="isNew"]')
  if (isNewEl) isNewEl.value = p.isNew ? "true" : "false"

  renderLinks(editImages, editLinks)
}

editForm.onsubmit = async e => {
  e.preventDefault()
  const data = new FormData(e.target)
  const id = data.get("id")
  const category = getSelectValue(editCategorySelect, editCategoryNew)
  const brand = getSelectValue(editBrandSelect, editBrandNew)
  if (!category) { alert("Оберіть або введіть категорію"); return }
  if (!brand) { alert("Оберіть або введіть бренд"); return }
  try {
    await apiFetch(`${ADMIN_API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        color: data.get("color"),
        description: data.get("description"),
        oldPrice: +data.get("oldPrice"),
        newPrice: +data.get("newPrice"),
        material: data.get("material"),
        dimensions: data.get("dimensions"),
        rating: +data.get("rating"),
        category,
        brand,
        images: [...editImages],
        inStock: +data.get("inStock"),
        available: data.get("available") === "true",
        isNew: data.get("isNew") === "true"
      })
    })
    editModal.style.display = "none"
    showSuccess()
    loadProducts()
  } catch (err) {
    alert("Помилка збереження: " + err.message)
  }
}

const searchInput = document.getElementById("searchInput")
searchInput?.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase().trim()
  if (!q) { renderProducts(allProducts); return }
  const filtered = allProducts.filter(p =>
    String(p.id).includes(q) || (p.name || "").toLowerCase().includes(q)
  )
  renderProducts(filtered)
})

loadProducts()
})