; Desktop Cat NSIS 安装脚本
; 用于检查和安装 Visual C++ Redistributable

!macro customInit
  ; 检查是否已安装 VC++ Redistributable 2015-2022 (x64)
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"

  ${If} $0 != 1
    ; 未安装，执行静默安装
    DetailPrint "正在安装 Visual C++ Redistributable..."
    ExecWait '"$PLUGINSDIR\vc_redist.x64.exe" /install /quiet /norestart' $1

    ${If} $1 != 0
      ; 安装失败，提示用户
      MessageBox MB_OK|MB_ICONEXCLAMATION "Visual C++ Redistributable 安装失败。$\n$\n请手动下载并安装：$\nhttps://aka.ms/vs/17/release/vc_redist.x64.exe"
    ${EndIf}
  ${EndIf}
!macroend

!macro customInstall
  ; 安装完成后的操作（如果需要）
!macroend

!macro customUnInit
  ; 卸载时的操作（如果需要）
!macroend
