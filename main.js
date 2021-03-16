
function createElement(tagName, attrs, ...children) {
    const e = document.createElement(tagName)
    Object.entries(Object(attrs || {})).forEach(([key, value]) => {
        e.setAttribute(key, value)
    })
    children.forEach(child => {
        e.appendChild(child)
    })
    return e
}


const app = <div>
    <div></div>
    <div></div>
    <p></p>
</div>

window.app = app
