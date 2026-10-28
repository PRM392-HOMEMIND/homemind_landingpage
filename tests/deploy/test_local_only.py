import importlib.util,json,pathlib,tempfile,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('owner_release',ROOT/'deploy/release.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
scope_spec=importlib.util.spec_from_file_location('owner_scope',ROOT/'scripts/local-only-release.py');scope=importlib.util.module_from_spec(scope_spec);scope_spec.loader.exec_module(scope)

class OwnerRelease(unittest.TestCase):
 def test_scoped_acceptance_reads_existing_monitor_and_never_http(self):
  c=m.Controller.__new__(m.Controller);c.local_only=True;c.candidate={'sha':'a'*40};c.state={}
  c.compose=lambda *args:'owned-container';c.docker=lambda *args:json.dumps({'Running':True,'Health':{'Status':'healthy'}})
  with patch.object(m,'smoke')as smoke:
   self.assertEqual(c.acceptance('https://homemind.vn','a'*40)['functional_tests'],'NOT_RUN_OWNER_EXCLUDED');smoke.assert_not_called()
 def test_unhealthy_platform_still_blocks(self):
  c=m.Controller.__new__(m.Controller);c.local_only=True;c.candidate={'sha':'a'*40};c.state={};c.compose=lambda *args:'owned-container';c.docker=lambda *args:json.dumps({'Running':True,'Health':{'Status':'unhealthy'}})
  with self.assertRaisesRegex(RuntimeError,'not healthy'):c.acceptance('https://homemind.vn','a'*40)
 def test_ordinary_releases_keep_http_acceptance(self):
  c=m.Controller.__new__(m.Controller);c.local_only=False
  with patch.object(m,'smoke')as smoke:c.acceptance('https://homemind.vn','a'*40);smoke.assert_called_once()
 def test_scoped_protection_keeps_metadata_and_omits_new_backend_probes(self):
  c=m.Controller.__new__(m.Controller);c.local_only=True;c.config={'protected_containers':[],'protected_files':[],'protected_systemd_units':[],'backend_observations':[{'url':'https://api.homemind.vn/v1/health/ready','status':200}]}
  with patch.object(m,'get_url')as get:c.protected();get.assert_not_called()
 def test_web_waiver_is_exact_and_failed_local_evidence_blocks(self):
  data={'releaseId':scope.ID,'repository':scope.REPO,'pullRequest':3,'baseSha':scope.BASE,'headRef':scope.HEAD,'source':{'fingerprint':'a','files':1},'status':'LOCAL_SCOPED_VALIDATION_COMPLETE','remoteTests':'PROHIBITED','localChecks':{k:{'status':'PASS'}for k in ['compile','fixtures','deploymentPolicy','security']}}
  self.assertTrue(scope.validate(data,data['source']))
  for key,value in [('pullRequest',4),('headRef','someone-else'),('repository','fork/repo')]:self.assertFalse(scope.validate({**data,key:value},data['source']))
  with self.assertRaises(ValueError):scope.validate({**data,'status':'INCOMPLETE'},data['source'])
 def test_all_executable_workflows_are_hashed(self):
  import subprocess
  with tempfile.TemporaryDirectory()as d:
   root=pathlib.Path(d);subprocess.run(['git','init','-q',str(root)],check=True);(root/'runtime.ts').write_text('runtime');original=scope.fingerprint(root)
   (root/'.github').mkdir();(root/'.github/workflow.yml').write_text('changed');self.assertNotEqual(scope.fingerprint(root),original)

if __name__=='__main__':unittest.main()
