import type CreativeEditorSDK from '@cesdk/cesdk-js';
import type { CreativeEngine } from '@cesdk/cesdk-js';

export function setupFeatures(cesdk: CreativeEditorSDK) {
  cesdk.feature.enable([
    'ly.img.navigation',
    'ly.img.text',
    'ly.img.crop',
    'ly.img.filter',
    'ly.img.adjustment',
    'ly.img.effect',
    'ly.img.blur',
    'ly.img.shadow',
    'ly.img.delete',
    'ly.img.duplicate',
    'ly.img.group',
    'ly.img.replace',
    'ly.img.fill',
    'ly.img.opacity',
    'ly.img.blendMode',
    'ly.img.page.settings',
    'ly.img.shape.options',
    'ly.img.combine',
    'ly.img.position',
    'ly.img.options',
    'ly.img.notifications',
    'ly.img.dock',
    'ly.img.library.panel',
  ]);

  cesdk.feature.set(
    'ly.img.stroke',
    ({ engine }: { engine: CreativeEngine }) => {
      const selectedBlocks = engine.block.findAllSelected();
      return !selectedBlocks.some(
        (id) => engine.block.getType(id) === '//ly.img.ubq/page'
      );
    }
  );

  cesdk.feature.set(
    'ly.img.canvas.menu',
    ({ engine }: { engine: CreativeEngine }) => {
      const selectedBlocks = engine.block.findAllSelected();
      return !selectedBlocks.some(
        (id) => engine.block.getType(id) === '//ly.img.ubq/page'
      );
    }
  );

  cesdk.feature.set(
    'ly.img.inspector.bar',
    ({ engine }: { engine: CreativeEngine }) => {
      const selectedBlocks = engine.block.findAllSelected();
      return !selectedBlocks.some(
        (id) => engine.block.getType(id) === '//ly.img.ubq/page'
      );
    }
  );
}
