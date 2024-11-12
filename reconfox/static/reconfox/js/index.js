function loadEmailTable() {
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  url = "/get_emails/"+domain_id
  $.getJSON(url, function (data) {
    var tableHead = $("#email-table-head");
    
    if (data.length != 0) {
      tableHead.html(`
        <tr>
          <th scope="col" style="background-color: #ffa600;">Email</th>
          <th scope="col" style="background-color: #ffa600;">Person</th>
          <th scope="col" style="background-color: #ffa600;">Has leaks</th>
          <th scope="col" style="background-color: #ffa600;">Spoofable</th>
          <th scope="col" style="background-color: #ffa600;">Found</th>
        </tr>
      `)
    }

    var tableBody = $("#email-table");
    tableBody.empty();

    $.each(data, function (index, item) {
      var row = $("<tr>");
      $.each(item, function (key, value) {
        if(key == "person") {
          if(value != "Unknown") {
            $("<td>").html("<a href='#'>"+value+"</a>").appendTo(row);
          }
          else {
            $("<td>").text(value).appendTo(row);
          }
        }
        else {
          $("<td>").text(value).appendTo(row);
        }
      });
      row.appendTo(tableBody);
      $('#exportEmailsTable').show()
    });

    if(tableBody.find("tr").length <= 1) {
      var email_content = $('#email-content');
      email_content.empty();
      email_content.html(`
        <div class="d-flex align-items-center justify-content-center vh-100">
          <p style="color: white">There is not data yet!</p>
        </div>
      `)
    }
  });
}

function loadStatCount(endpoint, element_id, domain_id) {
  url = "/"+endpoint+"/"+domain_id+"/"
  $.getJSON(url, function (data) {
    var stat = $(element_id);
    stat.empty();
    stat.html(data["count"]);
  });
}

function drawChart(element_id, labels, data, title) {
  const canvas = document.getElementById(element_id);
  const ctx = canvas.getContext('2d');
  if (canvas.chart) {
    // TO-DO: Not working, why???
    canvas.chart.destroy();
  }
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {labels: labels,datasets: [{data: data,}]},
    options: {responsive: true,plugins: {legend: {position: 'bottom',display: false},title: {position: "bottom", display: true,text: title}}},
  });
}

function getEmailsStats(domain_id) {
  url = "/emails_stats/"+domain_id+"/"
  $.getJSON(url, function (data) {
    var labels = ["Leaked", "Not leaked"]
    var counts = [data["has_leak"], data["total"]-data["has_leak"]]
    drawChart("email-chart-leak", labels, counts, "Emails leaked")
    
    var labels = ["Spoofable", "Not spoofable"]
    var counts = [data["spoofable"], data["total"]-data["spoofable"]]
    drawChart("email-chart-spoof", labels, counts, "Spoofable")

    var labels = ["People identified", "Not identified"]
    var counts = [data["identified"], data["total"]-data["identified"]]
    drawChart("email-chart-people", labels, counts, "Linked to a person")

    var labels = ["Services registerd", "Not detected"]
    var counts = [data["has_services"], data["total"]-data["has_services"]]
    drawChart("email-chart-services", labels, counts, "Used in external services")
  });
}

function loadDomainInfo(domain_id) {
  url = "/domain/"+domain_id+"/"
  $.getJSON(url, function (data) {
    
    if(data["error"]) {
      showToast(false,data["error"])
    }
    else {
      var domain_name = document.getElementById("domain-name");
      var domain_registrar = document.getElementById("domain-registrar");
      var domain_creation = document.getElementById("domain-creation");
      var domain_expiration = document.getElementById("domain-expiration");
      var domain_NS = document.getElementById("domain-NS");
      var dns_a_records = document.getElementById("dns-A-records");
      var dns_aaaa_records = document.getElementById("dns-AAAA-records");
      var dns_mx_records = document.getElementById("dns-MX-records");
      
      document.getElementById("email-domain").textContent = data["email_domain"] || "unknown";
      document.getElementById("email-pattern").textContent = data["email_pattern"] || "unknown";

      if (data["whois"] !== null) {
        domain_name.textContent = "domain_name" in data["whois"] ? data["whois"]["domain_name"] : undefined
        domain_registrar.textContent = "registrar" in data["whois"] ? data["whois"]["registrar"] : undefined
        domain_creation.textContent = "creation_date" in data["whois"] ? data["whois"]["creation_date"][0] : undefined
        domain_expiration.textContent = "expiration_date" in data["whois"] ? data["whois"]["expiration_date"][0] : undefined
        if (data["whois"]["name_servers"] !== null) {
          ns_info = "";
          data["whois"]["name_servers"].forEach( (ns, index, array) => {
            ns_info += ns + (index < array.length - 1 ? ", " : "");
          });
          domain_NS.textContent = ns_info;
        } else if (data["dns"] !== null) {
          ns_info = "";
          data["dns"]["NS"].forEach( (ns, index, array) => {
            ns_info += ns + (index < array.length - 1 ? ", " : "");
          });
          domain_NS.textContent = ns_info;
        }
      } 
      
      if (data["dns"] !== null) {
        if ("A" in data["dns"]) {
          let dns_a_text = data["dns"]["A"].join(', ');
          dns_a_records.textContent = dns_a_text;
        }
        if ("AAAA" in data["dns"]) {
          let dns_aaa_text = data["dns"]["AAAA"].join(', ');
          dns_aaaa_records.textContent = dns_aaa_text;
        }
        if ("MX" in data["dns"]) {
          let dns_mx_text = data["dns"]["MX"].join(', ');
          dns_mx_records.textContent = dns_mx_text;
        }
      }
    }
  });
}

function loadPeople() {
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  url = "/people_all?domain_id="+domain_id
  $.getJSON(url, function (data) {
    const cardContainer = $('#people-card-container');
    data.forEach(person => {
      const col = document.createElement('div');
      col.className = 'col-4 mb-3';
      const card = document.createElement('div');
      card.className = 'card h-100 shadow person';
      card.style.cursor = 'pointer';
      //card.style.width = '26rem';

      let socialIcons = '';
      if (person.twitter) {
        socialIcons += `<a href="${person.twitter}" class="text-decoration-none me-3" target="_blank"><i class="bi bi-twitter fs-4"></i></a>`;
      }
      if (person.facebook) {
        socialIcons += `<a href="${person.facebook}" class="text-decoration-none me-3" target="_blank"><i class="bi bi-facebook fs-4"></i></a>`;
      }
      if (person.linkedin) {
        socialIcons += `<a href="${person.linkedin}" class="text-decoration-none me-3" target="_blank"><i class="bi bi-linkedin fs-4"></i></a>`;
      }
      if (!person.twitter && !person.facebook && !person.linkedin) {
        socialIcons += `<a href="" class="text-decoration-none me-3" style="visibility: hidden"><i class="bi bi-twitter fs-4"></i></a>`;
      }

      person_name = person.name.length > 22 ? person.name.slice(0, 19) + '...': person.name
      person_name = person.name.length == 0 ? "[Not found]" : person_name

      card.innerHTML = `
      <div class="card-body">
        <div class="row">
        <div class="col-md-3 p-1">
          <img src="${person.url_img}" class="img-fluid float-left">
        </div>
        <div class="col-md-9">
          <h5 class="card-title">${person_name}</h5>
          <div class="d-flex align-items-center mb-2">
            <i class="bi bi-envelope-fill me-2"></i>
            <span class="me-3">${person.emails}</span>
            <i class="bi bi-file-earmark-text-fill me-2"></i>
            <span class="me-3">${person.files}</span>
            <i class="bi bi-key-fill me-2"></i>
            <span class="me-3">${person.keys}</span>
            <i class="bi bi-person-fill me-2"></i>
            <span>${person.accounts}</span>
          </div>
          <div class="col-md-12"> 
            <small>${person.job_title}</small>
          </div>
          <hr>
          <div class="d-flex align-items-center justify-content-center">
           ${socialIcons}
          </div> 
          <div class="personID d-none">${person.id}</div>
        </div>
        </div>
      </div>
      `;
      col.appendChild(card)
      cardContainer.append(col);
    });
  
    if(cardContainer.find(".card").length == 0) {

      cardContainer.html(`
        <div class="d-flex align-items-center justify-content-center vh-100">
          <p style="color: white">There is not data yet!</p>
        </div>
      `)
    }
  });
}

function loadPersonModal(personID) {
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  url = "/person_details/" + personID + "?domain_id=" + domain_id;

  const emailContainer = $("#personDetailedEmails");
  emailContainer.empty();

  const usernameContainer = $("#personDetailedUsernames");
  usernameContainer.empty();


  $.getJSON(url, function (data) {
    const emails = data.emails;
    const files = data.files;
    const software = data.software;
    const usernames = data.usernames;
    const name = document.getElementById("personInfoModalLabel");
    name.innerHTML = data["name"];
    const job_title = document.getElementById("personJobTitleModal");
    job_title.innerHTML = data["job_title"];
    const summary = document.getElementById("personSummary");
    summary.innerHTML = data["ocupation_summary"];

    // Populate Emails and Services
    emails.forEach((email) => {
      // Create the list item for each email
      const emailListItem = $("<li>").addClass("list-group-item");

      // Add the bold email text
      const emailText = $("<p>").addClass("fw-semibold mb-1").text(email.email);
      emailListItem.append(emailText);

      // Create a comma-separated list of services
      const servicesText = email.services.join(", ");
      const servicesParagraph = $("<p>").addClass("fs-6 text-secondary mb-1").text(`Registered in: ${servicesText}`);
      emailListItem.append(servicesParagraph);

      // Append the list item to the list
      $("#personDetailedEmails").append(emailListItem);
    });

    // Populate Usernames and Profiles as a list
    usernames.forEach((username) => {
      // Create a list item for each username
      const usernameListItem = $("<li>").addClass("list-group-item");

      // Username
      const usernameText = $("<p>").addClass("fw-semibold mb-0").text(username.username);
      usernameListItem.append(usernameText);

      // Profiles
      const profilesText = username.profiles.map(profile => profile.service).join(", ");
      const profilesParagraph = $("<p>").addClass("text-secondary mb-0").text(`Found on: ${profilesText}`);
      usernameListItem.append(profilesParagraph);

      // Password
      const passwordText = $("<p>").addClass("mb-0").html(`<span class="fw-semibold">Password:</span> ${username.password}`);
      usernameListItem.append(passwordText);

      // Leaked status
      const leakedStatus = username.leaked === true 
        ? '<span class="fw-semibold">Leaked:</span> <span class="text-danger">YES</span>'
        : '<span class="fw-semibold">Leaked:</span> <span class="text-success">NO</span>';
      const leakedParagraph = $("<p>").addClass("mb-0").html(leakedStatus);
      usernameListItem.append(leakedParagraph);

      // Append to the main list
      $("#personDetailedUsernames").append(usernameListItem);
    });

    files.forEach((file) => {
      // Create a list item for each file
      const listItem = $("<li>").addClass("list-group-item");
    
      // Add the file name in bold
      listItem.append(`<p class="fw-semibold mb-1">${file.filename}</p>`);
    
      // Add shared users as a secondary, smaller text
      if (file.shared_with.length > 0) {
        listItem.append(
          `<p class="text-secondary mb-1">Shared with: ${file.shared_with.join(", ")}</p>`
        );
      }
    
      // Append to the container
      $("#personDetailedFiles").append(listItem);
    });

    // Create a span for each software with a blue badge background
    software.forEach((soft) => {
      const badge = $("<span>")
        .addClass("badge bg-primary me-2") // Bootstrap classes for blue background and margin
        .text(soft);
      $("#personDetailedSoftware").append(badge);
    });
  });
}




function loadTasks() {
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  const taskRetrievalContainer = document.getElementById("task-retrieval-container");
  const taskAnalysisContainer = document.getElementById("task-analysis-container");
  taskRetrievalContainer.innerHTML = "";
  taskAnalysisContainer.innerHTML = "";
  url = "/get_tasks?domain_id="+domain_id
  $.getJSON(url, function (data) {
    initial_tasks = ["getWhoisInfoTask","getDNSRecordsTask","getSubdomainsTask", "getURLsTask", "getSubdomainsFromURLSTask", 
                    "findEmailsTask", "findEmailsFromURLsTask", "findSocialProfilesByEmailTask"]
    data.forEach(task => {
      const card = document.createElement('div');
      card.className = 'col-md-4 p-3';
      b = `
        <button id="${task.id}" type="button" class="btn btn-dark task-executer">Execute</button>
      `;
      pb = "";
      if(task.state != null && task.state != "SUCCESS") {
        b = `
          <button id="${task.id}" type="button" class="btn btn-secondary" disabled>${task.state}</button>
        `
        pb = `
          <div class="d-flex justify-content-between align-items-center">
            <div class="progress me-2" role="progressbar" aria-label="Animated striped example" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;">
              <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
            </div>
            <button id="${task.id}-cancel" type="button" class="btn btn-outline-dark"><i class="bi bi-x-lg"></i></button>
          </div>  
        `
      } 
      
      if(task.last_execution != null) {
        lt = `<p class="fs-6 fw-lighter">Last execution: ${task.last_execution}</p>`
      }
      else {
        lt = `<p class="fs-6 fw-lighter">Not executed</p>`
      }

      if(task.custom) {
        h5 = `<h5>
                <span class="fw-bold">${task.name}</span>
                <span class="badge-sm rounded-pill text-bg-warning align-text-bottom" style="position: relative; top: -10px; font-size: 0.8rem">
                  <span class="m-1">Custom</span>
                </span>
                ${lt}
              </h5>`
      }
      else if(initial_tasks.includes(task.id)){
        h5 = `<h5>
                <span class="fw-bold">${task.name}</span>
                <span class="badge-sm rounded-pill text-bg-primary align-text-bottom" style="position: relative; top: -10px; font-size: 0.8rem">
                  <span class="m-1">Initial Task</span>
                </span>
                ${lt}
              </h5>`
      }
      else {
        h5 = `<h5>
                <span class="fw-bold">${task.name}</span>
                ${lt}
              </h5>`
      }

      card.innerHTML = `
      <div class="card shadow h-100">
        <div class="card-body d-flex flex-column">
          <div class="row">
            <div class="col-md-12">
              ${h5}
              <p class="card-text">${task.description}</p>
            </div>  
          </div>
          <div class="row flex-fill">
            <div class="col-md-12 d-flex justify-content-end align-items-end">
              ${b}
            </div>
          </div>
          <div class="col-md-12 pt-1">
              ${pb}
          </div>
        </div>
      </div>
      `;
      if (task.type == "Retrieve") {
        taskRetrievalContainer.appendChild(card);
      }
      else {
        taskAnalysisContainer.appendChild(card);
      }
    });
  });
}

function updatePendingTasks() {
  // Get the domain ID from the active nav link
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  if (domain_id !== undefined) {
    // URL to fetch the current status of tasks
    url = "/get_tasks?domain_id="+domain_id

    $.getJSON(url, function(data) {
        // Assuming data is an array of task objects with their current state
        data.forEach(task => {
          // Find the button corresponding to the task
          var taskButton = document.getElementById(task.id);
          var cancelButton = document.getElementById(task.id+"-cancel");
          if (taskButton.innerHTML == "PENDING" && task.state != "PENDING") {
            $(taskButton).removeClass('btn-secondary').addClass('btn-dark').text('Execute').removeClass('disabled');
            $(taskButton).closest(".card-body").find(".progress").remove(); 
            $(cancelButton).remove();
          }
        });
    });
  }
}

// Call the update function every second
setInterval(updatePendingTasks, 2000);

function loadDomains() {
  url = "/get_domains"
  $.getJSON(url, function (data) {
    if(data.length == 0) {
      var myModal = new bootstrap.Modal($('#addDomainModal'));
      myModal.show()
    }

    var navItems = '';

    $.each(data, function(index, item) {
      var domain = item["domain"];
      var isActive = index === 0 ? 'active' : '';

      var navItem = '<li class="nav-item">';
      navItem += '<a id="v-pills-general-tab" class="nav-link ' + isActive + '" data-domain-id="'+item["id"]+'"data-domain="'+domain+'"data-bs-toggle="pill" href="#v-pills-general">';
      navItem += '<span class="d-flex align-items-center">';
      navItem += '<span class="me-2"><i class="bi bi-globe"></i></span>';
      navItem += '<span class="flex-grow-1">' + domain + '</span>';
      navItem += '<span class="trash"><i class="bi bi-trash"></i></span>';
      navItem += '<span class="dots">';
      navItem += '<div class="dropdown ms-auto">'
      navItem += '<i class="bi bi-three-dots-vertical" data-bs-toggle="dropdown" aria-expanded="false"></i>'
      navItem += '<ul class="dropdown-menu">'
      navItem += '<li>'
      navItem += '<span class="dropdown-item export_domain_graphml"><i class="bi bi-diagram-3"></i> GraphML</span>'
      navItem += '</li>'
      navItem += '<li>'
      navItem += '<span class="dropdown-item export_domain_csv"><i class="bi bi-filetype-csv"></i> Maltego</span>'
      navItem += '</li>'
      navItem += '</ul>'
      navItem += '</div>'
      navItem += '</span>';
      navItem += '</a>';
      navItem += '</li>';

      navItems += navItem;
    });

    $('#domain-list').html(navItems);
    $('#domain-list .nav-link .bi-trash').hide()
    $('#domain-list .nav-link.active .bi-trash').show()
    $('#domain-list .nav-link .bi-three-dots-vertical').hide()
    $('#domain-list .nav-link.active .bi-three-dots-vertical').show()
    var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
    
    loadData("nav-general", domain_id)
  });
}

function loadDorks() {
  const domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  const url = "/get_dorks_results?domain_id=" + domain_id;
  $.getJSON(url, function (data) {

    var tableHead = $("#dork-table-head");
    
    if (data.length != 0) {
      tableHead.html(`
        <tr>
          <th class="w-50" scope="col" style="background-color: #ffa600;">Dork</th>
          <th class="w-25" scope="col" style="background-color: #ffa600;">Category</th>
          <th class="w-25" scope="col" style="background-color: #ffa600;">Link</th>
        </tr>
      `)
    }
  
    var tableBody = $('#dork-table-body');
    tableBody.empty();

    $.each(data, function(index, item) {
      var row = $("<tr>");

      $.each(item, function (key, value) {
        if(key=="url"){
          $("<td>").html("<a href='"+value+"'>View</a>").appendTo(row);
        }
        else {
          $("<td>").text(value).appendTo(row);
        }
      });

      row.appendTo(tableBody);
    });

    if(tableBody.find("tr").length <= 1) {
      const dorks_container = $('#dorks-container');
      dorks_container.empty();
      dorks_container.html(`
        <div class="d-flex align-items-center justify-content-center vh-100">
          <p style="color: white">There is not data yet!</p>
        </div>
      `)
    }
  });
}

function loadSubdomains() {
  const domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  const url = "/get_subdomains?domain_id=" + domain_id;
  $.getJSON(url, function (data) {

    var tableHead = $("#subdomains-table-head");
    
    if (data.length != 0) {
      tableHead.html(`
        <tr>
          <th scope="col" style="background-color: #ffa600;">Subdomain</th>
          <th scope="col" style="background-color: #ffa600;">Active</th>
          <th scope="col" style="background-color: #ffa600;">Takeover</th>
          <th scope="col" style="background-color: #ffa600;">Source</th>
        </tr>
      `)
    }
  
    var tableBody = $('#subdomains-table-body');
    tableBody.empty();

    $.each(data, function(index, item) {
      var row = $("<tr>");

      $.each(item, function (key, value) {
        if(key == "takeover" || key == "is_active") {
          info = ""
          if(value == null) {
            info = "Unknown"
          }
          else if(value) {
            info = '<i class="bi bi-check2"></i>'
          }
          else {
            info = '<i class="bi bi-x-lg"></i>'
          }
          $("<td>").html(info).appendTo(row);
        }
        else {
          $("<td>").html(value).appendTo(row);
        }
      });

      row.appendTo(tableBody);
      $('#exportSubdomainsTable').show()
    });

    if(tableBody.find("tr").length <= 1) {
      const subdomains_container = $('#subdomains-container');
      subdomains_container.empty();
      subdomains_container.html(`
        <div class="d-flex align-items-center justify-content-center vh-100">
          <p style="color: white">There is not data yet!</p>
        </div>
      `)
    }
  });
}

function loadData(nav_id, domain_id) {
  $('#nav-group .nav-link.active').removeClass('active');
  if(nav_id == "nav-general") {
    $('#nav-general').addClass('active');
    $.ajax({url: "/general/", type: "GET", dataType: "html", success: function (data) {
      const content = document.getElementById("content");
      content.innerHTML = data;
      loadStatCount("people_count","#people-count-stats",domain_id)
      loadStatCount("files_count","#files-count-stats",domain_id)
      loadStatCount("subdomains_count","#subdomains-count-stats",domain_id)
      loadStatCount("emails_count","#emails-count-stats",domain_id)
      loadStatCount("urls_count","#urls-count-stats",domain_id)
      loadDomainInfo(domain_id)
      getEmailsStats(domain_id)
    }});
  }
  else if(nav_id == "nav-subdomains") {
    $('#nav-subdomains').addClass('active');
    $.ajax({url: "/subdomains/", type: "GET", dataType: "html", success: function (data) {
      const content = document.getElementById("content");
      content.innerHTML = data;
      loadSubdomains()
    }});
  }
  else if(nav_id == "nav-people") {
    $('#nav-people').addClass('active');
    $.ajax({url: "/people/", type: "GET", dataType: "html", success: function (data) {
      const content = document.getElementById("content");
      content.innerHTML = data;
      loadPeople()
    }});
  }
  else if(nav_id == "nav-emails") {
    $('#nav-emails').addClass('active');
    $.ajax({url: "/emails/", type: "GET", dataType: "html", success: function (data) {
      const content = document.getElementById("content");
      content.innerHTML = data;
      loadEmailTable()
    }});
  }
  else if(nav_id == "nav-dorks") {
    $('#nav-dorks').addClass('active');
    $.ajax({url: "/dorks/", type: "GET", dataType: "html", success: function (data) {
      const content = document.getElementById("content");
      content.innerHTML = data;
      loadDorks()
    }});
  }
  else if(nav_id == "nav-tasks") {
    $('#nav-tasks').addClass('active');
    $.ajax({url: "/tasks/", type: "GET", dataType: "html", success: function (data) {
      const content = document.getElementById("content");
      content.innerHTML = data;
      loadTasks()
    }});
  }
}

function showToast(success, text) {
  if(success) {
    const toastEl = document.getElementById('success-toast')
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl)
    const toastBody = document.getElementById('success-toast-body')
    toastBody.innerHTML = text
    toast.show() 
  }
  else {
    const toastEl = document.getElementById('error-toast')
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl)
    const toastBody = document.getElementById('error-toast-body')
    toastBody.innerHTML = text
    toast.show() 
  }
}

function loadFirstData(domain_id) {
  loadStatCount("people_count","#people-count-stats",domain_id)
  loadStatCount("files_count","#files-count-stats",domain_id)
  loadStatCount("subdomains_count","#subdomains-count-stats",domain_id)
  loadStatCount("emails_count","#emails-count-stats",domain_id)
  loadStatCount("urls_count","#urls-count-stats",domain_id)
  getEmailsStats(domain_id)
  loadDomainInfo(domain_id)
}

function exportToCSV(id, filename) {
  const table = document.getElementById(id);
  const rows = table.querySelectorAll('tr');
  
  let csvContent = 'data:text/csv;charset=utf-8,';
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td, th');
    const rowData = Array.from(cells)
      .map((cell) => cell.innerText)
      .join(',');
    
    csvContent += rowData + '\r\n';
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
}


$(document).ready(function () {
  loadDomains()
});


$(document).on('click', '.person', function() {
  var person_modal = new bootstrap.Modal(document.getElementById('personInfoModal'));
  var personID = $(this).find('.personID').text(); 
  loadPersonModal(personID)
  person_modal.show();

  // Initialize tooltips
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});


$(document).on('click', 'button.task-executer', function() {
  btn = $(this)
  
  tid = btn.attr("id")
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  url = "/execute_task?tid="+tid+"&domain_id="+domain_id
  
  $.getJSON(url, function (data) {
    
    if(data["error"]) {
      showToast(false, data["error"])
    }
    else {
      btn.removeClass('btn-dark')
      btn.addClass('btn-secondary')
      btn.addClass('disabled')
      btn.text('PENDING')
      btn.closest(".card-body").append(`
        <div class="d-flex justify-content-between align-items-center">
          <div class="progress me-2" role="progressbar" aria-label="Animated striped example" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;">
            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
          </div>
          <button id="${tid}-cancel" type="button" class="btn btn-outline-dark"><i class="bi bi-x-lg"></i></button>
        </div>
      `)
    }
  });
  
});

$(document).on('click', 'button[id$="-cancel"]', function() {
  cancel_btn = $(this)
  cancel_tid = $(this).attr('id').split('-')[0];
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  cancel_url = "/stop_task_execution?tid="+cancel_tid+"&domain_id="+domain_id;
  
  $.getJSON(cancel_url, function (data) {
    if(data["error"]) {
      showToast(false, data["error"])
    }
    else {
      $('#' + cancel_tid).text('Execute');
      $('#' + cancel_tid).removeAttr('disabled');
      $('#' + cancel_tid).removeClass('btn-secondary').addClass('btn-dark');
      $('#' + cancel_tid).closest(".card-body").find('.progress').remove();
      cancel_btn.remove();
      
    }
  });
});

$(document).on('click', 'button.megatask-executer', function() {
  btn = $(this)
  
  mtid = btn.attr("id")
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  url = "/execute_megatask?mtid="+mtid+"&domain_id="+domain_id

  $.getJSON(url, function (data) {
    
    if(data["error"]) {
      showToast(false, data["error"])
    }
    else {
      btn.removeClass('btn-dark')
      btn.addClass('btn-secondary')
      btn.addClass('disabled')
      btn.text('PENDING')
    }
  });
});

$('#nav-group a').on('click', function() {
  var id = $(this).attr('id');
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  loadData(id, domain_id)
});

$('#domain-list').on('click', '.nav-link', function() {
  $('#domain-list .nav-link .bi-trash').hide()
  $('#domain-list .nav-link.active .bi-trash').show()
  $('#domain-list .nav-link .bi-three-dots-vertical').hide()
  $('#domain-list .nav-link.active .bi-three-dots-vertical').show()
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  loadData("nav-general", domain_id)
});

$('#domain-list').on('click', '.nav-link .bi-trash', function(event) {
  event.stopPropagation();
  var myModal = new bootstrap.Modal(document.getElementById('removeDomainModal'));
  myModal.show()
});

$('#domain-list').on('click', '.nav-link .bi-three-dots-vertical', function(event) {
  event.stopPropagation();
});

$('#domain-list').on('click', '.nav-link .export_domain_graphml', function(event) {
  event.stopPropagation();
  console.log("hola")
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  var domain = $('#domain-list .nav-item .nav-link.active').attr('data-domain');
  url = "/export_domain_graphml/"+domain_id
  $.getJSON(url, function (data) {
    if(data["error"]) {
      showToast(false, data["error"])
    }
    else {      
      const a = document.createElement('a');
      const decodedContent = atob(data['msg']);
      a.href = window.URL.createObjectURL(new Blob([decodedContent]));
      a.download = domain+'_map.graphml'; // Specify the file name
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });
});

$('#domain-list').on('click', '.nav-link .export_domain_csv', function(event) {
  event.stopPropagation();
  console.log("hola")
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  var domain = $('#domain-list .nav-item .nav-link.active').attr('data-domain');
  url = "/export_domain_csv/"+domain_id
  $.getJSON(url, function (data) {
    if(data["error"]) {
      showToast(false, data["error"])
    }
    else {      
      const a = document.createElement('a');
      const decodedContent = atob(data['msg']);
      a.href = window.URL.createObjectURL(new Blob([decodedContent]));
      a.download = domain+'_map.csv'; // Specify the file name
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });
});


$('#deleteDomainButton').on('click', function() {
  var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
  url = "/delete/"+domain_id
  $.getJSON(url, function (data) {
    if(data["error"]) {
      showToast(false, data["error"])
    }
    else {
      showToast(true, data["msg"])
      loadDomains()
    }
  });
});

$('#addDomain').on('click', function() {
  var myModal = new bootstrap.Modal(document.getElementById('addDomainModal'));
  myModal.show()
});

$('#addDomainButton').on('click', function() {
  var domain = $("#addDomainModalInput").val()
  var email_domain = $("#addEmailDomainModalInput").val()
  var full_passive = $("#fullPassiveSwitch").prop("checked")
  console.log(full_passive)
  url = "/domain/add/?domain="+domain+"&email_domain="+email_domain+"&full_passive="+full_passive
  $.getJSON(url, function (data) {
    if(data["error"]) {
      showToast(false, data["error"])
    }
    else {
      showToast(true, data["msg"])
      setTimeout(function() {
        loadDomains()
        var domain_id = $('#domain-list .nav-item .nav-link.active').attr('data-domain-id');
        loadData("nav-general", domain_id)
      }, 3000);
    }
  });
});


$(document).on('click','#exportEmailsTable', function() {
  exportToCSV("email-table-all", "emails_export.csv")
});

$(document).on('click','#exportSubdomainsTable', function() {
  exportToCSV("subdomains-table-all", "subdomains_export.csv")
});

// Add this function to handle the search functionality
$(document).on('input', '#subdomain-search', function() {
    const searchValue = $(this).val().toLowerCase();
    $('#subdomains-table-body tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
    });
});

$(document).on('input', '#email-search', function() {
  const searchValue = $(this).val().toLowerCase();
  $('#email-table tr').filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
  });
});