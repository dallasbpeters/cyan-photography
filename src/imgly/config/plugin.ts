import type { EditorPlugin, EditorPluginContext } from '@cesdk/cesdk-js';
import CreativeEditorSDK from '@cesdk/cesdk-js';

import { setupActions } from './actions';
import { setupFeatures } from './features';
import { setupTranslations } from './i18n';
import { setupSettings } from './settings';
import { setupUI } from './ui';

export class PhotoEditorConfig implements EditorPlugin {
  name = 'cesdk-photo-editor';
  version = CreativeEditorSDK.version;

  async initialize(ctx: EditorPluginContext) {
    const subscriptions: (() => void)[] = [];
    const { cesdk, engine } = ctx;
    if (cesdk) {
      cesdk.resetEditor();
      setupFeatures(cesdk);
      setupUI(cesdk);
      setupActions(cesdk);
      setupTranslations(cesdk);
      setupOnReset(cesdk, subscriptions);
      setupSettings(engine);
      cesdk.reapplyLegacyUserConfiguration();
    }
  }
}

function setupOnReset(
  cesdk: CreativeEditorSDK,
  subscriptions: (() => void)[]
): void {
  cesdk.onReset(() => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    subscriptions.length = 0;
  });
}
