"use client";

import { useTeamScoreList } from "@/hooks/useTeamScoreList";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
// import { Form } from "./_components/Form"; // 通常のインポートをコメントアウト
import dynamic from "next/dynamic"; // dynamic をインポート
// import { recognizeTextFromImage } from "@/lib/ocr"; // OCRは使用しないためコメントアウト

// Form コンポーネントを動的にインポートし、SSRを無効化
const Form = dynamic(() => import("./_components/Form").then(mod => mod.Form), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading form...</div>, // ローディング中の表示
});

// SearchParamsを使用するコンポーネントをSuspenseでラップ
function HomeContent() {
  const { setTeamScoreList, teamScoreList, getRaceResult, getOverallTeamScores } = useTeamScoreList(); // getOverallTeamScores を追加
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    "「レース結果を取得」をクリックして開始してください。"
  );
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null); // ★ 追加

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage("OBSからスクリーンショットを取得中...");

    const captureScreenshotByObs = async () => {
      const response = await fetch("/api/obs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "OBS APIリクエストに失敗しました" }));
        throw new Error(errData.error || `OBS APIリクエスト失敗: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.success || !data.screenshot) {
        throw new Error(data.error || "OBSからスクリーンショットの取得に失敗しました");
      }
      return data.screenshot;
    };

    try {
      const obsResponseBase64 = await captureScreenshotByObs();
      setLastScreenshot(obsResponseBase64); // ★ スクリーンショットを保存
      setStatusMessage("Geminiで画像を分析中..."); // OCRステップを削除
      console.log("Gemini API分析を直接実行します。");

      await getRaceResult(obsResponseBase64); // この中で teamScoreList が更新される
      setError(null); // 成功時はエラークリア
      setStatusMessage("分析完了。次の取得の準備ができました。");
      console.info("Gemini分析が成功しました。");

    } catch (err: any) {
      console.error("データ取得または処理中にエラーが発生しました (page.tsx):", err);
      setError(err.message || "不明なエラーが発生しました。");
      setStatusMessage(`エラー: ${err.message}。次の取得の準備ができました。`);
    } finally {
      setIsLoading(false);
    }
  }, [getRaceResult, setTeamScoreList]);

  const handleFetchClick = () => {
    fetchData();
  };

  const handleFetchOverallScoresClick = async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage("OBSからスクリーンショットを取得中 (チーム合計)...");

    const captureScreenshotByObs = async () => {
      const response = await fetch("/api/obs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "OBS APIリクエストに失敗しました" }));
        throw new Error(errData.error || `OBS APIリクエスト失敗: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.success || !data.screenshot) {
        throw new Error(data.error || "OBSからスクリーンショットの取得に失敗しました");
      }
      return data.screenshot;
    };

    try {
      const obsResponseBase64 = await captureScreenshotByObs();
      setLastScreenshot(obsResponseBase64);
      setStatusMessage("Geminiで画像を分析中 (チーム合計)...");
      
      await getOverallTeamScores(obsResponseBase64); // ★ チーム合計点取得関数を呼び出し
      setError(null);
      setStatusMessage("チーム合計点の分析完了。");
      console.info("チーム合計点のGemini分析が成功しました。");

    } catch (err: any) {
      console.error("チーム合計点取得または処理中にエラーが発生しました (page.tsx):", err);
      setError(err.message || "不明なエラーが発生しました。");
      setStatusMessage(`エラー: ${err.message}。`);
    } finally {
      setIsLoading(false);
    }
  };

  let mainContent;
  if (teamScoreList.length > 0) {
    mainContent = (
      <Form
        teamScoreList={teamScoreList}
        setTeamScoreList={setTeamScoreList}
        lastScreenshot={lastScreenshot} // ★ 追加
      />
    );
  } else if (isLoading) {
    // ローディング表示はボタン内に統合するため何も表示しない
    mainContent = null;
  } else if (error) {
    // エラー表示もボタン内に含める/非表示にする
    mainContent = null;
    // エラーが発生していてもコンソールにのみ表示
    console.error("エラー:", error);
  } else {
    // 初期状態も非表示
    mainContent = null;
  }return (
    <div className="flex flex-col items-center w-full">
      {/* ボタンのみを表示するバー - 背景を完全透過 */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2"> {/* space-x-2 を追加してボタン間にスペースを設ける */}
        <button
          onClick={handleFetchClick}
          disabled={isLoading}
          className="bg-blue-600/90 hover:bg-blue-700/90 disabled:bg-slate-700/90
                    backdrop-blur-sm
                    text-white font-medium px-5 py-2.5 rounded-md
                    transition-all duration-200 shadow-lg
                    disabled:text-slate-300 disabled:cursor-not-allowed
                    flex items-center justify-center min-w-[180px]"
        >
          {isLoading && statusMessage?.includes("レース結果") ? ( // statusMessageでどちらの処理中か判別
            <div className="flex flex-col items-center">
              <div className="h-6 w-6 rounded-full border-3 border-white border-t-transparent animate-spin mb-1"></div>
              <span className="text-sm">{statusMessage}</span>
            </div>
          ) : error && statusMessage?.includes("レース結果") ? ( // statusMessageでどちらのエラーか判別
            <div className="flex flex-col items-center">
              <span className="text-red-300 font-bold">エラー発生</span>
              <span className="text-xs text-red-200/80 max-w-[170px] truncate">{error}</span>
            </div>
          ) : (
            <span className="font-bold">レース結果を取得</span>
          )}
        </button>
        {/* 新しいボタン: チーム合計点を取得 */}
        <button
          onClick={handleFetchOverallScoresClick}
          disabled={isLoading}
          className="bg-green-600/90 hover:bg-green-700/90 disabled:bg-slate-700/90
                    backdrop-blur-sm
                    text-white font-medium px-5 py-2.5 rounded-md
                    transition-all duration-200 shadow-lg
                    disabled:text-slate-300 disabled:cursor-not-allowed
                    flex items-center justify-center min-w-[180px]"
        >
          {isLoading && statusMessage?.includes("チーム合計") ? ( // statusMessageでどちらの処理中か判別
            <div className="flex flex-col items-center">
              <div className="h-6 w-6 rounded-full border-3 border-white border-t-transparent animate-spin mb-1"></div>
              <span className="text-sm">{statusMessage}</span>
            </div>
          ) : error && statusMessage?.includes("チーム合計") ? ( // statusMessageでどちらのエラーか判別
            <div className="flex flex-col items-center">
              <span className="text-red-300 font-bold">エラー発生</span>
              <span className="text-xs text-red-200/80 max-w-[170px] truncate">{error}</span>
            </div>
          ) : (
            <span className="font-bold">チーム合計点を取得</span>
          )}
        </button>
      </div>
        {/* メインコンテンツ - 完全透過 */}
      <div className="w-full mx-auto mt-8"> {/* pt-4 から mt-8 に変更してトップマージンを増加 */}
        {teamScoreList.length > 0 ? (
          <div className="bg-transparent">
            {mainContent}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ホームページコンポーネント - HomeContentをSuspenseでラップして再エクスポート
export default function Home() {
  return (
    <main className="min-h-screen bg-transparent p-4 flex flex-col">
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-transparent">
          <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </main>
  );
}
