"use client"
import { useEffect, useRef } from "react"

export default function Vanta() {
  const vantaRef = useRef(null)
  const vantaEffect = useRef(null)

  useEffect(() => {
    // Charge les scripts dynamiquement côté client
    let threeScript, vantaScript

    async function loadVanta() {
      if (typeof window !== "undefined") {
        // Ajoute Three.js
        threeScript = document.createElement("script")
        threeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        threeScript.async = true
        document.body.appendChild(threeScript)
        // Quand Three.js est chargé, ajoute Vanta
        threeScript.onload = () => {
          vantaScript = document.createElement("script")
          vantaScript.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.dots.min.js"
          vantaScript.async = true
          document.body.appendChild(vantaScript)
          vantaScript.onload = () => {
            if (window.VANTA) {
              vantaEffect.current = window.VANTA.DOTS({
                el: vantaRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: 0x5ca3fa,
                color2: 0x5ca3fa,
                backgroundColor: 0x1e2833,
                spacing: 25.00
              })
            }
          }
        }
      }
    }

    loadVanta()

    // Cleanup à l'unmount
    return () => {
      if (vantaEffect.current && typeof vantaEffect.current.destroy === "function") {
        vantaEffect.current.destroy()
      }
      if (threeScript) document.body.removeChild(threeScript)
      if (vantaScript) document.body.removeChild(vantaScript)
    }
  }, [])

  return (
    <div
      ref={vantaRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -1,
      }}
    />
  )
}