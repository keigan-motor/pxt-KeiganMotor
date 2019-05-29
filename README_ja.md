# pxt-keiganmotor

KeiganMotor を micro:bit から無線（RADIO）経由でコントロールできます。

<img src="https://github.com/keigan-motor/pxt-KeiganMotor/blob/master/icon.png?raw=true" width="640">

- 製品サイト: https://keigan-motor.com
- ドキュメント: https://document.keigan-motor.com

## 必要条件
1. KeiganMotor KM-1 シリーズ: **デバイスファームウェアのバージョンは 2.06 以上**
2. micro:bit MakeCode エディタ (https://makecode.microbit.org)
       機能拡張 →「検索または、プロジェクトのURLを入力」　の欄に 検索ワード "Keigan" または、以下のライブラリのアドレスを入力します
       
## セットアップ
### KeiganMotor 
KeiganMotor の無線モードを、Bluetooth Low Energy(BLE) から、micro:bit に変更します。

1. KeiganMotor の電源を入れる
2. 停止ボタン（四角のマーク）を10回押す
3. 自動で micro:bit モードとして再起動する
（micro:bit モードで起動直後、LED は黄色に2秒間点滅します)

一度 micro:bit モードに設定すると、電源をOFFした後も micro:bit モードで起動します。
BLEモードに戻す場合は、停止ボタンを10回押します。

### MakeCode エディタ
新規プロジェクトを作成し、"pxt-KeiganMotor" 拡張をプロジェクトに追加します。

1. https://makecode.microbit.org にアクセスします
2. 右上の歯車のアイコンの、"機能拡張" → 「検索または、プロジェクトのURLを入力」　の欄に 検索ワード "Keigan" または、https://github.com/keigan-motor/pxt-KeiganMotor を入力します
3. 表示された "KeiganMotor" 拡張をクリックして追加します

## 重要
KeiganMotor を micro:bit から無線で制御するために、KeiganMotor の 4桁の "name" と、micro:bit 用 RADIO "group" を知る必要があります。
これらは、MakeCode での KeiganMotor 初期化時に利用されます。

### (1) Name
KeiganMotor デバイス固有の4桁の英数字です。
以下の方法いずれかによって調べることができます。

1. シリアルナンバー8桁の下4桁
- シリアルナンバーが "ABCDEFGH", の場合、name は "EFGH" です  
2. Bluetooth Low Energy でアドバタイズされるデバイスネームに含まれる4桁
- デバイスネームが "KM-1 EFGH#RGB" の場合、name は "EFGH" です。
   - KeiganCore や他のBLEアプリからスキャンによって知ることができます。

### (2) RADIO group
MakeCode 上と、KeiganMotor の RADIO グループを一致させる必要があります。
KeiganMotor のデフォルト RADIO グループは、0 です。0~255 の値を設定できます。
複数の KeiganMotor を制御する場合は、それぞれ異なる RADIO グループに設定することを推奨します。
下部の、"複数の KeiganMotor を制御する" を参照下さい。

#### KeiganMotor の RADIO グループを調べる
以下のプロジェクトを使用して下さい。
##### KMRadioGroupFinder
https://makecode.microbit.org/_fbvR7ifav6Ht
1. Edit を押してプロジェクトを開きます。
2. 変数 "name" に、グループを調べたい KeiganMotor の name を入れます
3. micro:bit にダウンロードし、"A" ボタンを押します
4. 指定の name の KeiganMotor が見つかった場合、ディスプレイに、name: group の形式で表示されます

#### KeiganMotor の RADIO グループを書き換える
以下のプロジェクトを使用して下さい。
##### KMRadioGroupWriter
https://makecode.microbit.org/_2RoaiV5R4Y3T
1. Edit を押してプロジェクトを開きます
2. 変数 "name" に、グループを書き換えたい KeiganMotor の name を入れます
3. 変数 "newGroupId" に変更後のグループID入れます（0~255）
4. micro:bit にダウンロードし、"A" ボタンを押します
5. 定の name の KeiganMotor が見つかった場合、変更後のグループIDが書き込まれます
6. KeiganMotor は新しいグループIDで自動で再起動します


## ブロック
KeiganMotor を指定速度で回転させて、LEDを点灯するサンプルです。
<img src="https://github.com/keigan-motor/pxt-KeiganMotor/blob/master/images/block.png?raw=true" width="640">

## JavaScript
### 初期化
```typescript
// Initialize KeiganMotor by RADIO group and its name
// RADIO group should be from 0 to 255
let m = keiganmotor.create(0, "EFGH") // RADIO group ID = 0, name = "EFGH"
```

### モーターの動作許可
```typescript
m.enable() 
```

### 回転
```typescript
m.runRpm(10) // run at velocity 10 [rotation/minute]
basic.pause(10000) // wait for 10 seconds
m.stop() // stop (set speed to 0)
```
### LED
```typescript
m.led(led_state.ON_SOLID, 255, 255, 0) // Set LED color to RGB(255,255,0) = yellow
```

### 複数の KeiganMotor を制御する
**混線を避けるため、RADIO group はそれぞれ別々の数字に設定して下さい**

```typescript
let m1 = keiganmotor.create(0, "EFGH")
let m2 = keiganmotor.create(1, "PQRS")

m1.enable()
m2.enable()
```
#### TIPS
同じ RADIO group で複数の KeiganMotor を制御する場合は、
混線を避けるため、 "basic.pause(50)" を送信コマンドの間に挿入して下さい

```typescript
m1.moveToDeg(30)
basic.pause(50)
m2.moveToDeg(-30)
```

## ライセンス

MIT

## サポートターゲット

* for PXT/microbit
  (The metadata above is needed for package search.)
