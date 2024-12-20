<div align="center">
    <img src="https://github.com/bytemallet/ReconFox/blob/main/reconfox/static/reconfox/imgs/ReconFox_logo.png" alt="Emails tab" width="10%">
</div>

# ReconFox - OSINT tool for domain profiling
During the reconnaissance phase, an attacker searches for any information about his target to create a profile that will later help him to identify possible ways to get in an organization. ReconFox performs passive analysis techniques (which do not interact directly with the target) using OSINT to extract a large amount of data given a web domain name. This tool will retrieve emails, people, files, subdomains, usernames and urls that will be later analyzed to extract even more valuable information. 

In addition, ReconFox leverages an Ollama instance, enabling it to harness the power of LLM (Large Language Models). ReconFox can utilize OpenAI and llama2, a pre-trained LLM model, to generate brief descriptions of the roles of individuals within an organization. This functionality provides valuable insights into the organizational structure and facilitates the identification of key personnel. Moreover, ongoing development efforts aim to introduce additional features and enhancements to further enrich the tool's capabilities in the future.

**NOTE:** ReconFox does not require any special hardware to operate. However, it's important to consider the hardware requirements when using tasks that utilize the Large Language Model (LLM). For detailed information about the specific requirements for the LLM model you intend to use, please refer to the official [Ollama documentation](https://ollama.ai/library).

## :house: ReconFox architecture
This project stack uses Django for web and API management, PostgreSQL for database handling, and Celery with Redis for efficient asynchronous task processing, making it highly scalable and responsive. AI features are enabled through OpenAI for natural language tasks and Ollama for custom model integration, allowing for powerful data processing and ML capabilities that enhance the application’s functionality and user experience.

## 🛠️ Installation
```
git clone https://github.com/bytemallet/ReconFox.git
cd ReconFox/reconfox
mv reconfox_config.sample.py reconfox_config.py
cd ..
docker-compose up -d
```
You can now access ReconFox navigating with your browser to:
```
http://127.0.0.1:8000/
```
**NOTE:** You must add API Keys inside reconfox_config.py file

#### Google Programmable Search Engine API
* [Create your custom engine and get the ID](https://programmablesearchengine.google.com/controlpanel/all)
* [Create API KEY](https://developers.google.com/custom-search/v1/overview)

## Default modules
ReconFox has 2 different types of modules, those which retreives data and those which analyse it to extract more relevant information.
### :mag: Retrieval modules
| Name | Description |
| ---- | ----------- |
| Get Whois Info | Get relevant information from Whois register. |
| Get DNS Records | This task queries the DNS. |
| Get Subdomains | This task uses Alienvault OTX API, CRT.sh, and HackerTarget as data sources to discover cached subdomains. |
| Get Subdomains From URLs | Once some tasks have been performed, the URLs table will have a lot of entries. This task will check all the URLs to find new subdomains. |
| Get URLs | It searches all URLs cached by Wayback Machine and saves them into the database. This will later help to discover other data entities like files or subdomains. |
| Get Files from URLs | It loops through the URLs database table to find files and store them in the Files database table for later analysis. The files that will be retrieved are: doc, docx, ppt, pptx, pps, ppsx, xls, xlsx, odt, ods, odg, odp, sxw, sxc, sxi, pdf, wpd, svg, indd, rdp, ica, zip, rar |
| Find Email | It looks for emails using queries to Google, Bing and leaked databases. |
| Find People from Emails | Once some emails have been found, it can be useful to discover the person behind them. Also, it finds usernames from those people. |
| Find Emails From URLs | Sometimes, the discovered URLs can contain sensitive information. This task retrieves all the emails from URL paths. |
| Execute Dorks | It will execute the dorks defined in the dorks folder. Remember to group the dorks by categories (filename) to understand their objectives. |
| Find Emails From Dorks | By default, ReconFox has some dorks defined to discover emails. This task will look for them in the results obtained from dork execution. |
| Find People From Google | Uses the Google JSON API to find people who work in the company asociated to the domain |

### :microscope: Analysis
| Name | Description |
| ---- | ----------- |
| Check Subdomains Take-Over | It performs some checks to determine if a subdomain can be taken over. |
| Check If Domain Can Be Spoofed | It checks if a domain, from the emails ReconFox has discovered, can be spoofed. This could be used by attackers to impersonate a person and send emails as him/her. |
| Get Profiles From Usernames | This task uses the discovered usernames from each person to find profiles from services or social networks where that username exists. This is performed using the [Sherlock](https://github.com/sherlock-project/sherlock) tool. It is worth noting that although a profile with the same username is found, it does not necessarily mean it belongs to the person being analyzed. |
| Download All Files | Once files have been stored in the Files database table, this task will download them in the "download_files" folder. |
| Get Metadata | Using exiftool, this task will extract all the metadata from the downloaded files and save it to the database. |
| Get Emails From Metadata | As some metadata can contain emails, this task will retrieve all of them and save them to the database. |
| Get Emails From Files Content | Usually, emails can be included in corporate files, so this task will retrieve all the emails from the downloaded files' content. |
| Find Registered Services using Emails | It is possible to find services or social networks where an email has been used to create an account. This task will check if an email ReconFox has discovered has an account in Twitter, Adobe, Facebook, Imgur, Mewe, Parler, Rumble, Snapchat, Wordpress, and/or Duolingo. |
| Check Breach | This task checks Firefox Monitor service to see if an email has been found in a data breach. Although it is a free service, it has a limitation of 10 queries per day. If Leak-Lookup API key is set, it also checks it. |
| \[AI-Powered\] Profile Analisys | Examine metadata and generate a description and job title for each person. |
| \[AI-Powered\] User-File Linkage and Software Detection | Identify relationships between users and files, determining which documents users have engaged with, while also noting the software associated with each file. |
| \[AI-Powered\] Get Email Pattern | Examines the gathered email addresses to identify the primary pattern used by the organization. |
| Get leaked passwords | Using Proxy Nova's free service, ReconFox can detect and display passwords from usernames found that have been leaked in the past. |

## :pill: Custom modules
ReconFox lets you create custom modules, you just need to add your script inside `infohoudn/tool/custom_modules`. One custome module has been added as an example which uses [Holehe](https://github.com/megadose/holehe) tool to check if the emails previously are attached to an account on sites like Twitter, Instagram, Imgur and more than 120 others. 

```
# Import the packages you need
import trio
import httpx
import requests
from holehe import core

# Import the Django models you will work with
from reconfox.models import Emails

MODULE_ID = "findRegisteredSitesHoleheCustomTask" # Set a module ID
MODULE_NAME = "Find sites with Holehe" # Set a module name
MODULE_DESCRIPTION = "Using Holehe tool, this task will find where an email has been used to create an account. Holehe checks more than 120 sites."  # Set a description
MODULE_TYPE = "Analysis" # Set the type: Analysis or Retrieve


# This function is the only function it will be called by ReconFox
# Change its content and create other the functions if needed
def custom_task(domain_id):
	trio.run(findRegisteredSitesHolehe, domain_id)


async def findRegisteredSitesHolehe(domain_id):
	queryset = Emails.objects.filter(domain_id=domain_id)
	for entry in queryset.iterator():
		out = []
		email = entry.email

		modules = core.import_submodules("holehe.modules")
		websites = core.get_functions(modules)
		client = httpx.AsyncClient()

		for website in websites:
			await core.launch_module(website, email, client, out)
			print(out)
		await client.aclose()

		services = []
		for item in out:
			if item["exists"]:
				services.append(item["name"])

		entry.registered_services = services
		entry.save()
```

## :camera: Screenshots
<p align="center"><img src="https://github.com/bytemallet/ReconFox/blob/main/reconfox_general_view.png" alt="Emails tab" width="80%"></p>

## :eight_spoked_asterisk: Export to GraphML
Do you want to create a visualization graph with the findings? You can export the whole domain analysis to a GraphML file and open it with yED, Gephi or any tool of your choice. It currently exports files, people, emails, social profiles, registered sites and usernames. URLs and subdomains are not included due to the amount of results.
<p align="center"><img src="https://github.com/bytemallet/ReconFox/blob/main/graph_example.png" alt="Graph visualization example" width="50%"></p>

## :eight_pointed_black_star: Export to Maltego
Do you want to proceed with tools like Maltego for your extended investigations? You can export the entire domain analysis (including files, individuals, emails, social profiles, registered sites, and usernames) to a Maltego-compatible file (CSV) and open it there. You'll find the Maltego Column Mapping configuration file ([_maltego_mapping.mtz_](maltego_mapping.mtz)) in the project's root directory. [Learn more about importing into Maltego](https://docs.maltego.com/support/solutions/articles/15000010797-import-graph-from-table)

## :bulb: Inspired by
* [Holehe](https://github.com/megadose/holehe)
* [Maigret](https://github.com/soxoj/maigret)
* [Sherlock](https://github.com/sherlock-project/sherlock)
* [reconFTW](https://github.com/six2dez/reconftw)
* [Poastal](https://github.com/jakecreps/poastal)
* And many others
