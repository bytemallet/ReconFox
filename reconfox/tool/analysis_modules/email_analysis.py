import re
import requests
import httpx
import reconfox.reconfox_config as config
from holehe import core
from django.db import IntegrityError
from reconfox.models import Emails, Domain
from reconfox.tool.ai_assistant import openai_helper
from reconfox.tool.data_sources.services import adobe,duolingo,imgur,mewe,parler,rumble,snapchat,twitter,wordpress
from reconfox.tool.data_sources.leaks import leak_lookup, firefox_monitor, proxy_nova

def checkBreach(domain_id):
	queryset = Emails.objects.filter(is_leaked__isnull=True,domain_id=domain_id)
	for entry in queryset.iterator():
		email = entry.email
		if config.LEAK_LOOKUP_KEY:
			entry.is_leaked = leak_lookup.isLeaked(email)
		else:
			entry.is_leaked = proxy_nova.checkEmailLeaked(email) or firefox_monitor.isLeaked(email)
		entry.save()

def getEmailPattern(domain_id):
	email_usernames = []
	domain = Domain.objects.get(id=domain_id)
	queryset = Emails.objects.filter(domain_id=domain_id)
	
	for entry in queryset.iterator():
		username = entry.email.split("@")[0]
		email_usernames.append(username)
	
	prompt = f"""
		Analyze the following usernames and identify the common pattern they follow:

		Usernames:
		{', '.join(email_usernames)}

		Please provide the generic pattern in a clear format. Examples of patterns could be:
		- 'first_name.last_name'
		- 'first_initial.last_name'
		- etc.

		Pattern:
		"""
	
	pattern = openai_helper.callGPT(prompt)
	if pattern.startswith("'") and pattern.endswith("'"):
		pattern = pattern[1:-1]
	domain.email_pattern = pattern
	domain.save()

		
				

def findRegisteredSites(domain_id):
	queryset = Emails.objects.filter(domain_id=domain_id)
	for entry in queryset.iterator():
		email = entry.email
		print(email)
		services = entry.registered_services

		if services is None:
			services = []

		if "twitter" not in services:
			try:
				if twitter.twitter_email(email):
					services.append("twitter")
			except Exception as e:
				pass
		if "adobe" not in services:
			try:
				if adobe.adobe_email(email):
					services.append("adobe")
			except Exception as e:
				pass
		if "facebook" not in services:
			try:
				if adobe.adobe_facebook_email(email):
					services.append("facebook")
			except Exception as e:
				pass
		if "imgur" not in services:
			try:
				if imgur.imgur_email(email):
					services.append("imgur")
			except Exception as e:
				pass
		if "mewe" not in services:
			try:
				if mewe.mewe_email(email):
					services.append("mewe")
			except Exception as e:
				pass
		if "parler" not in services:
			try:
				if parler.parler_email(email):
					services.append("parler")
			except Exception as e:
				pass
		if "rumble" not in services:
			try:
				if rumble.rumble_email(email):
					services.append("rumble")
			except Exception as e:
				pass
		if "snapchat" not in services:
			try:
				if snapchat.snapchat_email(email):
					services.append("snapchat")
			except Exception as e:
				pass
		if "wordpress" not in services:
			try:
				if wordpress.wordpress_email(email):
					services.append("wordpress")
			except Exception as e:
				pass
		if "duolingo" not in services:
			try:
				if duolingo.duolingo_email(email):
					services.append("duolingo")
			except Exception as e:
				pass
		entry.registered_services = services
		
		entry.save()


async def findRegisteredSitesHolehe(domain_id):
	queryset = Emails.objects.filter(registered_services__isnull=True,domain_id=domain_id)
	for entry in queryset.iterator():
		out = []
		email = entry.email

		modules = core.import_submodules("holehe.modules")
		websites = core.get_functions(modules)
		client = httpx.AsyncClient()

		for website in websites:
			out = await core.launch_module(website, email, client, out)
			print(out)
		await client.aclose()

		services = []
		for item in out:
			if item["exists"]:
				services.append(item["name"])

		entry.registered_services = services
		entry.save()

