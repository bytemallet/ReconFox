import reconfox.reconfox_config as config
import reconfox.utils
from django.db import IntegrityError
from django.utils import timezone
from reconfox.tool.data_sources import google_data
from reconfox.models import Domain, Dorks, Results, URLs



def executeDorks(domain_id):
	# load dorks list in case there are new ones
	reconfox.utils.load_dorks(domain_id)

	
	queryset = Dorks.objects.filter(last_executed__isnull=True, domain_id=domain_id)
	for entry in queryset.iterator():
		dork = entry.dork
		(results, total, gathered, limit) = google_data.getUrls(dork)
		for res in results:
			domain = Domain.objects.get(id=domain_id).domain
			if domain in res[0]:
				url, created = URLs.objects.get_or_create(url=res[0], domain_id=domain_id)

				if created:
					url.source = "Dorks"
					url.save()

			try:
				Results.objects.get_or_create(url=url,dork=entry,description=res[1],all_info=res[2],last_detected=timezone.now(), domain_id=domain_id)
			except IntegrityError as e:
				pass
			entry.total_results = total
			entry.results_gathered = gathered
		if limit:
			print("Limit reached - Not all dorks have been executed")
			break
		
		entry.last_executed = timezone.now()
		entry.save()
		
	
	