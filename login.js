document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  if (!loginForm) return

  loginForm.addEventListener("submit", e => {
    e.preventDefault()
    const u = document.getElementById("login").value
    const p = document.getElementById("pass").value
    if (u === "admin" && p === "12Sm8O43") {
      localStorage.setItem("auth", "yes")
      window.location.href = "admin.html"
    } else {
      document.getElementById("error").innerText = "Невірний логін або пароль"
    }
  })
})