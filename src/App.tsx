import { Scene } from './components/Scene'
import { HUD } from './components/HUD'

export default function App() {
  return (
    <div className="relative h-full w-full bg-[#0b0520]">
      <Scene />
      <HUD />
    </div>
  )
}
