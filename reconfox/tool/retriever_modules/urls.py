import sqlite3
import reconfox.reconfox_config as config
from django.db import IntegrityError
from reconfox.tool.data_sources import archive
from reconfox.models import Domain,Subdomains,URLs

def getURLs(domain_id):
	data = []
	domain = Domain.objects.get(id=domain_id).domain
	url_list = archive.getAllUrls(domain)
	for url in url_list:
		try:
			URLs.objects.get_or_create(url=url[0], archive_url=url[1], source="Archive", domain_id=domain_id)
		except IntegrityError as e:
				pass
	
