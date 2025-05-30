export const PROMPT = `
  ## instruction ##
  これは「マリオカート8DX」のレース結果画面の画像です。
  画像を解析して、全プレイヤーの順位、ユーザー名、チーム情報、および合計得点を抽出し、指定されたJSON形式で出力してください。

  結果画面には通常、各プレイヤーについて左から以下の情報が含まれています（レイアウトは若干異なる場合があります）：
  1. 順位 (例: 1st, 2nd, 3rd... または単に数字)
  2. ユーザー名
  3. プレイヤーごとの合計得点 (例: 1500, 1250...)

  ## extraction_rules ##
  - [rank]: プレイヤーの順位を整数で抽出してください (例: 1, 2, 3, ..., 12)。
  - [name]: プレイヤーのユーザー名をそのまま抽出してください。
  - [totalScore]: プレイヤーの合計得点を整数で抽出してください (例: 1500, 1250)。
  - [team]: 以下のルールでチーム名を識別してください：
    
    1. まず、全プレイヤー名を確認し、名前の後ろに共通する単語パターンがあるか調べてください。
       例：「チーズバーガー」「てりやきバーガー」「つるみバーガー」などの場合、「バーガー」が共通部分
    
    2. 複数のプレイヤーで共通の単語が末尾にある場合、その単語をチーム名として使用してください。
       例：「チーズバーガー」「てりやきバーガー」→ チーム名「バーガー」
    
    3. 同様に「レッドゾーンX」「レッドゾーンZ」「レッドゾーン☆」のように共通の接頭辞がある場合、
       その共通部分をチーム名として使用してください。
       例：「レッドゾーンX」「レッドゾーンZ」→ チーム名「レッドゾーン」
    
    4. 「I\'m Kotaro」「I\'m Masaya」「I\'m Tomoya」のように、共通部分がある場合は
       その共通部分をチーム名として使用してください。
       例：「I\'m Kotaro」「I\'m Masaya」→ チーム名「I\'m」
    
    5. 上記のパターンが見つからず、共通のチーム名が特定できない場合は、従来通りユーザー名の
       最初の1文字をチーム名として使用してください：
       重要：ユーザー名の最初の1文字をチーム名として使用する場合、同じ文字から始まるプレイヤーはすべて同じチームとして扱ってください。例えば、「Apple」と「Ant」というプレイヤーがいる場合、両方ともチーム「A」となります。
       - アルファベット大文字（例：「ABCD」→「A」）
       - アルファベット小文字（例：「abcd」→「a」）
       - ひらがな（例：「あいう」→「あ」）
       - カタカナ（例：「アイウ」→「ア」）
       - 数字（例：「123」→「1」）
    
    6. 空白や特殊文字のみの場合は "UNKNOWN" としてください
  - [isCurrentPlayer]: プレイヤーの行の背景が黄色かどうかを判別してください。
    - 黄色背景は、そのプレイヤーが操作プレイヤー（マイプレイヤー）であることを示します。
    - 黄色背景が検出された場合、true を設定してください。それ以外の場合は false を設定してください。(boolean値で返す)
    - 背景色は完全な黄色 (#FFFF00) ではない可能性があります。濃い黄色やオレンジに近い黄色も黄色背景とみなしてください。
    - 透明度や他の色との混合により、判別が難しい場合があるため、慎重に判断してください。明らかに黄色系の背景と識別できる場合にのみ true としてください。

  ## output_format ##
  以下のJSON形式で、全プレイヤーの情報を "results" 配列に含めてください。
  もし、提供された画像が「マリオカート8DX」のリザルト画面ではない、またはリザルト情報を読み取れない場合は、代わりに以下の形式のエラーJSONを出力してください:
  {
    "error": "リザルト画面ではないか、情報を読み取れませんでした。"
  }

  リザルト情報が読み取れる場合のJSON形式 (キーと値はダブルクォートで囲んでください):
  {
    "results": [
      {
        "rank": "[rank]",
        "name": "[name]",
        "team": "[team]",
        "totalScore": "[totalScore]",
        "isCurrentPlayer": [isCurrentPlayer] // boolean (true/false) を直接記述
      }
      // ... 他のプレイヤー情報が続く
    ]
  }
  ## important_notes ##
  - 必ず指定されたJSON形式のいずれかで応答してください。
  - ユーザー名は画像に表示されている通りに正確に抽出してください。
  - プレイヤーは最大12人です。画像に表示されている全プレイヤーの情報を抽出してください。
  - チーム名の判別は非常に重要です。同じチームに所属するプレイヤーが同じチーム名になるよう注意してください。
  
  ## チーム名判別例 ##
  例1: 以下のような結果の場合
  1. チーズバーガー
  2. てりやきバーガー
  3. つるみバーガー
  → 全て「バーガー」というチーム名を使用

  例2: 以下のような結果の場合
  5. レッドゾーンX
  6. レッドゾーンZ
  7. レッドゾーン☆
  12. レッドゾーンF
  → 全て「レッドゾーン」というチーム名を使用

  例3: 以下のような結果の場合 
  4. I'm Kotaro
  8. I'm Masaya
  11. I'm Tomoya
  → 全て「I'm」というチーム名を使用
`;
