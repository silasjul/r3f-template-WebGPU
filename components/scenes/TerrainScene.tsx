import Terrain from '@/components/Terrain';
import { useTerrainTweaks } from '@/hooks/inspector/useTerrainTweaks';

export default function TerrainScene() {
  useTerrainTweaks();

  return <Terrain />;
}
