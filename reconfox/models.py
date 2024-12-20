from django.db import models

class Domain(models.Model):
    domain = models.CharField(max_length=255)
    email_domain = models.CharField(max_length=255, null=True, default=None)
    email_pattern = models.CharField(max_length=255, null=True, default=None)
    whois_data = models.JSONField(null=True, default=None)
    dns_records = models.JSONField(null=True, default=None)
    full_passive = models.BooleanField(default=True)
    has_email_server = models.BooleanField(null=True, default=None)

class People(models.Model):
    name = models.CharField(max_length=255)
    phones = models.JSONField(null=True,default=list)
    social_profiles = models.JSONField(default=list)
    job_title = models.TextField(default="This profile doesn't have a job title yet. You can use the profile analysis task to employ an AI-powered tool to get one.")
    ocupation_summary = models.TextField(default="This profile doesn't have a description yet. You can use the profile analysis task to employ an AI-powered tool that examines the metadata and creates a description for you.")
    raw_metadata = models.TextField(null=True,default=None)
    url_img = models.TextField(default="https://static.thenounproject.com/png/994628-200.png")
    source = models.CharField(max_length=255)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    class Meta:
        unique_together = (('name', 'domain'),)

# TO-DO: change spoofable to allow 3 states
class Emails(models.Model):
    email = models.CharField(max_length=255)
    people = models.ForeignKey(People, on_delete=models.SET_NULL, null=True)
    registered_services = models.JSONField(default=list, null=True)
    spoofable = models.BooleanField(null=True)
    is_leaked = models.BooleanField(null=True)
    source = models.CharField(max_length=255)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    class Meta:
        unique_together = (('email', 'domain'),)

class Subdomains(models.Model):
    subdomain = models.CharField(max_length=255, primary_key=True)
    takeover = models.BooleanField(null=True, default=None)
    is_active = models.BooleanField(null=True, default=None)
    service = models.CharField(max_length=255)
    source = models.CharField(max_length=255)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    class Meta:
        unique_together = (('subdomain', 'domain'),)

class URLs(models.Model):
    url = models.TextField()
    archive_url = models.TextField(null=True)
    source = models.CharField(max_length=255)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    class Meta:
        unique_together = (('url', 'domain'),)

class Files(models.Model):
    url = models.ForeignKey(URLs, on_delete=models.SET_NULL, null=True)
    url_download = models.TextField()
    filename = models.CharField(max_length=255)
    metadata = models.JSONField(null=True)
    software_used = models.JSONField(default=list)
    source = models.CharField(max_length=255)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE) 
    class Meta:
        unique_together = (('filename', 'domain'),)
    

class Dorks(models.Model):
    dork = models.TextField()
    category = models.CharField(max_length=255)
    total_results = models.IntegerField(null=True)
    results_gathered = models.IntegerField(null=True)
    last_executed = models.DateField(null=True)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    class Meta:
        unique_together = (('dork', 'domain'),)

class Results(models.Model):
    url = models.ForeignKey(URLs, on_delete=models.CASCADE)
    dork = models.ForeignKey(Dorks, on_delete=models.CASCADE)
    description = models.TextField()
    all_info = models.JSONField()
    last_detected = models.DateField()
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    class Meta:
        unique_together = (('url', 'dork', 'domain'),)

class Usernames(models.Model):
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255, null=True)
    profiles = models.JSONField(default=list)
    people = models.ForeignKey(People, on_delete=models.SET_NULL, null=True)
    source = models.CharField(max_length=255)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    class Meta:
        unique_together = (('username', 'domain'),)

class Tasks(models.Model):
    tid = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    description = models.TextField()
    celery_id = models.CharField(max_length=255, null=True)
    custom = models.BooleanField()
    TASK_TYPE_CHOICES = [("analysis", "Analysis"),("retrieve", "Retrieve")]
    task_type = models.CharField(max_length=10, choices=TASK_TYPE_CHOICES)
    last_execution = models.DateTimeField(null=True)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    class Meta:
        unique_together = (('tid', 'domain'),)
    
class PeopleFiles(models.Model):
    people = models.ForeignKey(People, on_delete=models.CASCADE)
    file = models.ForeignKey(Files, on_delete=models.CASCADE)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('people', 'file', 'domain'),)

class IPs(models.Model):
    ip = models.CharField(max_length=12, primary_key=True)
    all_info = models.TextField(null=True)
    is_vulnerable = models.BooleanField(null=True)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
