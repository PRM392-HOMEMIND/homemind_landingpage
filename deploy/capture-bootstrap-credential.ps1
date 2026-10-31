# Windows-only interactive capture. Password is DPAPI-encrypted for this user.
# No password is passed as an argument or written as plaintext.
throw 'Disabled by the no-password-storage instruction. Use ssh-audit-client.py --password-dialog for ephemeral input.'
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$credentialDirectory = Join-Path $env:LOCALAPPDATA 'HomeMindDeployment'
$credentialPath = Join-Path $credentialDirectory 'vps-103.200.22.211-root.clixml'
if (!(Test-Path -LiteralPath $credentialDirectory)) {
    New-Item -ItemType Directory -Path $credentialDirectory | Out-Null
}
$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$acl = New-Object System.Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true, $false)
$acl.SetOwner($sid)
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule($sid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
$acl.AddAccessRule($rule)
Set-Acl -LiteralPath $credentialDirectory -AclObject $acl

$form = New-Object System.Windows.Forms.Form
$form.Text = 'HomeMind - secure VPS credential'
$form.Size = New-Object System.Drawing.Size(500, 235)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$label = New-Object System.Windows.Forms.Label
$label.Text = "Enter the root password for VPS 103.200.22.211.`nStored encrypted for your Windows account, outside Git.`nSSH authentication waits for console fingerprint verification."
$label.Location = New-Object System.Drawing.Point(20, 18)
$label.Size = New-Object System.Drawing.Size(450, 65)
$form.Controls.Add($label)
$passwordBox = New-Object System.Windows.Forms.TextBox
$passwordBox.UseSystemPasswordChar = $true
$passwordBox.Location = New-Object System.Drawing.Point(20, 90)
$passwordBox.Size = New-Object System.Drawing.Size(445, 25)
$form.Controls.Add($passwordBox)
$ok = New-Object System.Windows.Forms.Button
$ok.Text = 'Save securely'
$ok.Location = New-Object System.Drawing.Point(230, 140)
$ok.Size = New-Object System.Drawing.Size(120, 30)
$ok.Add_Click({
    if ($passwordBox.Text.Length -eq 0) { return }
    $secret = ConvertTo-SecureString -String $passwordBox.Text -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential('root', $secret)
    $credential | Export-Clixml -LiteralPath $credentialPath
    $passwordBox.Clear()
    $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.Close()
})
$form.Controls.Add($ok)
$cancel = New-Object System.Windows.Forms.Button
$cancel.Text = 'Cancel'
$cancel.Location = New-Object System.Drawing.Point(365, 140)
$cancel.Size = New-Object System.Drawing.Size(100, 30)
$cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.Controls.Add($cancel)
$form.AcceptButton = $ok
$form.CancelButton = $cancel
try {
    $result = $form.ShowDialog()
    if ($result -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output 'CREATED encrypted credential' }
    else { Write-Output 'CANCELLED; no credential captured' }
} finally {
    $passwordBox.Clear()
    $form.Dispose()
}
