"""Exact owner F02-F12 UI release; local tests, compile/security/deploy on CI."""
import hashlib,json,os,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
ID='OWNER_F02_F12_LOCAL_ONLY_20261027'
REPO='QuangVMZu/HomeMind_LandingPage'
BASE='c07da07ae6eea8ee43a1ac95dc06c7282368a7e2'
HEAD='billing/f02-f12-recovery-20261027'
EVIDENCE='scripts/f02-f12-release.json'
def fingerprint(root=ROOT):
 names=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0');rows=[]
 for name in sorted(set(names)-{''}):
  if name==EVIDENCE or name.lower().endswith('.md'):continue
  p=root/name
  if p.is_symlink()or not p.is_file():raise ValueError('Unsafe release input')
  rows.append({'path':name,'blob':subprocess.check_output(['git','hash-object','--path='+name,name],cwd=root,text=True).strip()})
 return {'fingerprint':hashlib.sha256(json.dumps(rows,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'files':len(rows)}
def validate(data,actual):
 if data.get('releaseId')!=ID or data.get('repository')!=REPO or data.get('pullRequest')!=3 or data.get('baseSha')!=BASE or data.get('headRef')!=HEAD:return False
 if data.get('source')!=actual or data.get('status')!='LOCAL_SCOPED_VALIDATION_COMPLETE' or data.get('remoteTests')!='PROHIBITED':raise ValueError('Local release evidence/source mismatch')
 if set(data.get('localChecks',{}))!={'compile','fixtures','deploymentPolicy','security'} or any(v.get('status')!='PASS'for v in data['localChecks'].values()):raise ValueError('Local UI scope incomplete')
 return True
def active(event,kind,ref):
 p=ROOT/EVIDENCE
 if not p.exists()or os.environ.get('GITHUB_REPOSITORY')!=REPO:return False
 if kind=='pull_request':
  pr=event['pull_request']
  if pr['number']!=3:return False
  if pr['base']['sha']!=BASE or pr['head']['ref']!=HEAD or pr['head']['repo']['full_name']!=REPO:raise ValueError('Untrusted release PR')
 elif kind=='push'and ref=='refs/heads/main':
  prs=json.loads(subprocess.check_output(['gh','api','repos/'+REPO+'/commits/'+os.environ['GITHUB_SHA']+'/pulls'],text=True))
  if not any(pr['number']==3 and pr.get('merged_at')and pr['base']['sha']==BASE and pr['head']['ref']==HEAD for pr in prs):return False
 else:return False
 return validate(json.loads(p.read_text()),fingerprint())
if __name__=='__main__':
 result=active(json.loads(pathlib.Path(os.environ['GITHUB_EVENT_PATH']).read_text()),os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])
 tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip()
 with open(os.environ['GITHUB_OUTPUT'],'a')as f:f.write('active='+str(result).lower()+'\ntree='+tree+'\n')
 print(json.dumps({'ownerRelease':ID,'active':result,'remoteTests':'NOT_RUN_OWNER_EXCLUDED'if result else 'STANDARD_POLICY','localEvidenceIsIndependentAttestation':False}))
