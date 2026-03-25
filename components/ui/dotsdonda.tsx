"use client"

export default function DotsOnDa() {
  return (
    <div className="h-full w-full bg-card relative">
  {/* Noise Texture (Darker Dots) Background */}
  <div
    className="absolute inset-0 z-0 h-full w-full"
    style={{
      background: "primary",
      backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.25) 1px, transparent 0)",
      backgroundSize: "15px 15px",
    }}
  />
     {/* Your Content/Components */}
</div>
  )
}