import subprocess
import re
import os
import time
from reconfox.models import Usernames
from reconfox.tool.data_sources.leaks import proxy_nova
import reconfox.reconfox_config as config


import re
import subprocess

def getProfiles(domain):
	queryset = Usernames.objects.filter(domain_id=domain)
	for entry in queryset.iterator():
		command = ['sherlock', entry.username]
		try:
			output = subprocess.run(command, capture_output=True, text=True, check=True)
			lines = output.stdout.split('\n')
			# Ensure profiles is a list
			if entry.profiles is None:
				entry.profiles = []
			data = entry.profiles

			for line in lines[1:-1]:
				line = line.strip()
				if line:
					match = re.match(r'\[\+\] (\S.*): (.+)', line.strip())
					if match:
						app_name = match.group(1)
						link = match.group(2)
						service = {"service": app_name, "link": link}
						if service not in data:
							data.append(service)

			entry.profiles = data
			entry.save()  # Save after processing all lines

		except subprocess.CalledProcessError as e:
			print(f"An error occurred: {e}")
			print(f"Command output: {e.stdout}")
			print(f"Error message: {e.stderr}")
		break

def getLeakedPasswords(domain_id):
	queryset = Usernames.objects.filter(password__isnull=True,domain_id=domain_id)
	for entry in queryset.iterator():
		pwd = proxy_nova.getPassword(entry.username)
		if pwd:
			entry.password = pwd
			entry.is_leaked = True
			entry.save()
		time.sleep(0.2)
		
