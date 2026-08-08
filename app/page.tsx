import Scene from '@/components/Scene'
import { useParametersToggle } from "tsl-inspector"

export default function Home() {
  useParametersToggle()

  return (
    <main className="w-full h-lvh">
      <Scene />
    </main>
  )
}
