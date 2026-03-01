import {
  customProvider,
  type LanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const NOT_CONFIGURED_MESSAGE =
  "AI provider not configured. Connect your own backend to enable AI.";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

function throwNotConfigured(): LanguageModel {
  throw new Error(NOT_CONFIGURED_MESSAGE);
}

/** Stub: AI Gateway removed. Provide your own model when connecting your backend. */
export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }
  return throwNotConfigured();
}

/** Stub: AI Gateway removed. Provide your own model when connecting your backend. */
export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return throwNotConfigured();
}

/** Stub: AI Gateway removed. Provide your own model when connecting your backend. */
export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  return throwNotConfigured();
}
