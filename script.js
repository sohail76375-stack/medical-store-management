/* ==========================================
   ONE-TIME CLEAN START: CLEAR PROJECT DATA
   Keeps application code and theme preference unchanged.
========================================== */
(function clearExistingProjectDataOnce() {
    const resetKey = "medicalStoreFullDataResetV1";
    if (localStorage.getItem(resetKey) === "1") return;

    [
        "districtMedicineUsers",
        "districtLoggedInUser",
        "districtMedicineHospitals",
        "districtMedicineMedicines",
        "districtMedicineOutflows"
    ].forEach(key => localStorage.removeItem(key));

    localStorage.setItem(resetKey, "1");
})();

/* ==========================================
   AUTH ELEMENTS
========================================== */

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const forgotForm =
    document.getElementById("forgotForm");

const changePasswordForm =
    document.getElementById("changePasswordForm");


const loginFormElement =
    document.getElementById("loginFormElement");

const registerFormElement =
    document.getElementById("registerFormElement");

const forgotFormElement =
    document.getElementById("forgotFormElement");

const changePasswordFormElement =
    document.getElementById(
        "changePasswordFormElement"
    );


const authPage =
    document.getElementById("authPage");

const dashboardPage =
    document.getElementById("dashboardPage");


/* ==========================================
   LOCAL ACCOUNT DATABASE
========================================== */

function getUsers() {

    const users =
        localStorage.getItem(
            "districtMedicineUsers"
        );

    return users
        ? JSON.parse(users)
        : [];

}


function saveUsers(users) {

    localStorage.setItem(
        "districtMedicineUsers",
        JSON.stringify(users)
    );

}


/* ==========================================
   FORM SWITCHING
========================================== */

function hideAllForms() {

    loginForm.classList.remove("active");

    registerForm.classList.remove("active");

    forgotForm.classList.remove("active");

    changePasswordForm.classList.remove("active");

}


function showLogin() {

    hideAllForms();

    loginForm.classList.add("active");

}


function showRegister() {

    hideAllForms();

    registerForm.classList.add("active");

}


function showForgot() {

    hideAllForms();

    forgotForm.classList.add("active");

}


/* ==========================================
   PASSWORD SHOW / HIDE
========================================== */

function togglePassword(inputId, button) {

    const input =
        document.getElementById(inputId);

    if (input.type === "password") {

        input.type = "text";

        button.classList.add("visible");

    } else {

        input.type = "password";

        button.classList.remove("visible");

    }

}


/* ==========================================
   CNIC NUMBERS ONLY
========================================== */

const cnicInputs = [

    document.getElementById("loginCnic"),

    document.getElementById("registerCnic"),

    document.getElementById("forgotCnic")

];


cnicInputs.forEach((input) => {

    input.addEventListener(
        "input",
        () => {

            input.value =
                input.value
                .replace(/\D/g, "")
                .slice(0, 13);

        }
    );

});


/* ==========================================
   THEME
========================================== */

const themeBtn =
    document.getElementById("themeBtn");


const savedTheme =
    localStorage.getItem(
        "district-theme"
    );


if (savedTheme === "light") {

    document.body.classList.add("light");

}


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light"
        );

        const light =
            document.body.classList.contains(
                "light"
            );

        localStorage.setItem(
            "district-theme",
            light ? "light" : "dark"
        );

    }
);


/* ==========================================
   REGISTRATION
========================================== */

registerFormElement.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const name =
            document.getElementById(
                "registerName"
            ).value.trim();

        const cnic =
            document.getElementById(
                "registerCnic"
            ).value.trim();

        const password =
            document.getElementById(
                "registerPassword"
            ).value;

        const confirmPassword =
            document.getElementById(
                "confirmPassword"
            ).value;


        if (!name || !cnic || !password) {

            showNotification(
                "Missing information",
                "Please complete all fields."
            );

            return;

        }


        if (cnic.length !== 13) {

            showNotification(
                "Invalid CNIC",
                "CNIC must contain exactly 13 digits."
            );

            return;

        }


        if (password.length < 6) {

            showNotification(
                "Weak password",
                "Password must contain at least 6 characters."
            );

            return;

        }


        if (password !== confirmPassword) {

            showNotification(
                "Password mismatch",
                "The passwords do not match."
            );

            return;

        }


        const users = getUsers();


        const alreadyExists =
            users.some(
                user => user.cnic === cnic
            );


        if (alreadyExists) {

            showNotification(
                "CNIC already registered",
                "An account with this CNIC already exists."
            );

            return;

        }


        users.push({

            name: name,

            cnic: cnic,

            password: password

        });


        saveUsers(users);


        document.getElementById(
            "registerFormElement"
        ).reset();


        showNotification(
            "Account created",
            "Your account has been registered successfully."
        );


        setTimeout(
            showLogin,
            1000
        );

    }
);


/* ==========================================
   LOGIN
========================================== */

loginFormElement.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const cnic =
            document.getElementById(
                "loginCnic"
            ).value.trim();

        const password =
            document.getElementById(
                "loginPassword"
            ).value;


        if (cnic.length !== 13) {

            showNotification(
                "Invalid CNIC",
                "Enter your complete 13 digit CNIC."
            );

            return;

        }


        const users = getUsers();


        const user =
            users.find(
                account =>
                    account.cnic === cnic
            );


        if (!user) {

            showNotification(
                "Account not found",
                "No account exists with this CNIC."
            );

            return;

        }


        if (user.password !== password) {

            showNotification(
                "Incorrect password",
                "The password you entered is incorrect."
            );

            return;

        }


        localStorage.setItem(
            "districtLoggedInUser",
            JSON.stringify(user)
        );


        openDashboard(user);

    }
);


/* ==========================================
   FORGOT PASSWORD - CNIC CHECK
========================================== */

let recoveryCnic = "";


forgotFormElement.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const cnic =
            document.getElementById(
                "forgotCnic"
            ).value.trim();


        if (cnic.length !== 13) {

            showNotification(
                "Invalid CNIC",
                "Enter your complete 13 digit CNIC."
            );

            return;

        }


        const users = getUsers();


        const user =
            users.find(
                account =>
                    account.cnic === cnic
            );


        if (!user) {

            showNotification(
                "CNIC not found",
                "No registered account was found with this CNIC."
            );

            return;

        }


        recoveryCnic = cnic;


        document.getElementById(
            "verifiedUserName"
        ).textContent =
            user.name;


        hideAllForms();

        changePasswordForm.classList.add(
            "active"
        );

    }
);


/* ==========================================
   CHANGE PASSWORD
========================================== */

changePasswordFormElement.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const newPassword =
            document.getElementById(
                "newPassword"
            ).value;

        const confirmNewPassword =
            document.getElementById(
                "confirmNewPassword"
            ).value;


        if (newPassword.length < 6) {

            showNotification(
                "Weak password",
                "Password must contain at least 6 characters."
            );

            return;

        }


        if (
            newPassword !==
            confirmNewPassword
        ) {

            showNotification(
                "Password mismatch",
                "The passwords do not match."
            );

            return;

        }


        const users = getUsers();


        const userIndex =
            users.findIndex(
                user =>
                    user.cnic === recoveryCnic
            );


        if (userIndex === -1) {

            showNotification(
                "Error",
                "Account could not be found."
            );

            return;

        }


        users[userIndex].password =
            newPassword;


        saveUsers(users);


        recoveryCnic = "";


        changePasswordFormElement.reset();


        showNotification(
            "Password changed",
            "Your password has been updated successfully."
        );


        setTimeout(
            showLogin,
            1200
        );

    }
);


/* ==========================================
   DASHBOARD OPEN
========================================== */

function openDashboard(user) {

    authPage.style.display =
        "none";

    dashboardPage.classList.add(
        "active"
    );


    document.getElementById(
        "dashboardUserName"
    ).textContent =
        user.name;


    const initial =
        user.name
        .charAt(0)
        .toUpperCase();

    document.getElementById(
        "userInitial"
    ).textContent = initial;

    const sidebarInitial = document.getElementById("sidebarUserInitial");
    const sidebarName = document.getElementById("sidebarUserName");

    if (sidebarInitial) sidebarInitial.textContent = initial;
    if (sidebarName) sidebarName.textContent = user.name;

    updateTodayDate();

}


/* ==========================================
   TODAY'S DATE
========================================== */

function updateTodayDate() {

    const today =
        new Date();


    const options = {

        weekday: "long",

        year: "numeric",

        month: "long",

        day: "numeric"

    };


    document.getElementById(
        "todayDate"
    ).textContent =
        today.toLocaleDateString(
            "en-US",
            options
        );

}


/* ==========================================
   DASHBOARD NAVIGATION
========================================== */

const dashboardSections = [

    "dashboard",

    "hospitals",

    "medicines",

    "inventory",

    "monthly",

    "reports",

    "staff"

];


function openDashboardSection(
    section,
    button
) {

    dashboardSections.forEach(
        name => {

            const element =
                document.getElementById(
                    name === "dashboard"
                        ? "dashboardSection"
                        : name + "Section"
                );

            if (element) {

                element.classList.remove(
                    "active"
                );

            }

        }
    );


    const target =
        document.getElementById(
            section === "dashboard"
                ? "dashboardSection"
                : section + "Section"
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }

    if (section === "monthly" && typeof renderMonthlyRecords === "function") {
        renderMonthlyRecords();
    }


    const titles = {

        dashboard:
            [
                "Dashboard",
                "Welcome back. Here's today's overview."
            ],

        hospitals:
            [
                "Hospitals",
                "Manage hospitals and their medicine records."
            ],

        medicines:
            [
                "Medicines",
                "Manage medicines and medicine information."
            ],

        inventory:
            [
                "Medicine Outflow",
                "Record medicine supplied to hospitals."
            ],

        monthly:
            [
                "Monthly Records",
                "View medicine records by month."
            ],

        reports:
            [
                "Reports",
                "Analyze hospital and medicine activity."
            ],

        staff:
            [
                "Staff",
                "Manage authorized store staff."
            ]

    };


    if (titles[section]) {

        document.getElementById(
            "dashboardTitle"
        ).textContent =
            titles[section][0];


        document.getElementById(
            "dashboardSubtitle"
        ).textContent =
            titles[section][1];

    }

}


function openDashboardSectionByName(
    section
) {

    const buttons =
        document.querySelectorAll(
            ".sidebar .nav-item"
        );


    let targetButton = null;


    buttons.forEach(
        button => {

            const onclick =
                button.getAttribute(
                    "onclick"
                );


            if (
                onclick &&
                onclick.includes(
                    "'" + section + "'"
                )
            ) {

                targetButton =
                    button;

            }

        }
    );


    openDashboardSection(
        section,
        targetButton
    );

}


/* ==========================================
   DASHBOARD THEME
========================================== */

function updateDashboardThemeUI() {

    const light = document.body.classList.contains("light");
    const text = document.getElementById("dashboardThemeText");
    const icon = document.getElementById("dashboardThemeIcon");

    if (text) {
        text.textContent = light ? "Dark theme" : "Light theme";
    }

    if (icon) {
        icon.innerHTML = light
            ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2z"/></svg>';
    }
}

function toggleDashboardTheme() {

    document.body.classList.toggle("light");

    const light = document.body.classList.contains("light");

    localStorage.setItem(
        "district-theme",
        light ? "light" : "dark"
    );

    updateDashboardThemeUI();

}

updateDashboardThemeUI();


/* ==========================================
   LOGOUT
========================================== */

function logout() {

    dashboardPage.classList.remove(
        "active"
    );

    authPage.style.display =
        "block";

    showLogin();


    document.getElementById(
        "loginPassword"
    ).value = "";

}


/* ==========================================
   NOTIFICATIONS
========================================== */

const notification =
    document.getElementById(
        "notification"
    );

const notificationTitle =
    document.getElementById(
        "notificationTitle"
    );

const notificationMessage =
    document.getElementById(
        "notificationMessage"
    );


let notificationTimer;


function showNotification(
    title,
    message
) {

    notificationTitle.textContent =
        title;

    notificationMessage.textContent =
        message;


    notification.classList.add(
        "show"
    );


    clearTimeout(
        notificationTimer
    );


    notificationTimer =
        setTimeout(
            () => {

                notification.classList.remove(
                    "show"
                );

            },
            3500
        );

}
/* =========================================================
   CURRENT REQUEST: PROFILE + HOSPITAL MANAGEMENT
========================================================= */

function getCurrentDashboardUser() {
    const saved = localStorage.getItem("districtLoggedInUser");
    return saved ? JSON.parse(saved) : null;
}

function openProfileMenu() {
    const user = getCurrentDashboardUser();
    if (!user) return;
    const modal = document.getElementById("profileModal");
    const initial = (user.name || "U").charAt(0).toUpperCase();
    document.getElementById("modalProfileInitial").textContent = initial;
    document.getElementById("modalProfileName").textContent = user.name || "Store User";
    document.getElementById("modalProfileCnic").textContent = user.cnic || "—";
    document.getElementById("profilePasswordPanel").classList.remove("open");
    document.getElementById("profileCurrentPassword").value = "";
    document.getElementById("profileNewPassword").value = "";
    document.getElementById("profileConfirmPassword").value = "";
    modal.classList.add("open");
}

function closeProfileMenu(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.remove("open");
}

function showProfilePassword() {
    document.getElementById("profilePasswordPanel").classList.add("open");
    document.getElementById("profileCurrentPassword").focus();
}

function hideProfilePassword() {
    document.getElementById("profilePasswordPanel").classList.remove("open");
}

function changePasswordFromProfile() {
    const user = getCurrentDashboardUser();
    if (!user) return;
    const current = document.getElementById("profileCurrentPassword").value;
    const next = document.getElementById("profileNewPassword").value;
    const confirm = document.getElementById("profileConfirmPassword").value;

    if (current !== user.password) {
        showNotification("Incorrect password", "Your current password is not correct.");
        return;
    }
    if (next.length < 6) {
        showNotification("Weak password", "New password must contain at least 6 characters.");
        return;
    }
    if (next !== confirm) {
        showNotification("Password mismatch", "The new passwords do not match.");
        return;
    }

    const users = getUsers();
    const index = users.findIndex(item => item.cnic === user.cnic);
    if (index === -1) {
        showNotification("Account error", "Your account could not be found.");
        return;
    }
    users[index].password = next;
    saveUsers(users);
    const updatedUser = { ...user, password: next };
    localStorage.setItem("districtLoggedInUser", JSON.stringify(updatedUser));
    document.getElementById("profilePasswordPanel").classList.remove("open");
    document.getElementById("profileCurrentPassword").value = "";
    document.getElementById("profileNewPassword").value = "";
    document.getElementById("profileConfirmPassword").value = "";
    showNotification("Password updated", "Your password has been changed successfully.");
}

function getHospitals() {
    const saved = localStorage.getItem("districtMedicineHospitals");
    if (saved) {
        try { return JSON.parse(saved) || []; } catch { return []; }
    }
    return [];
}

function saveHospitals(hospitals) {
    localStorage.setItem("districtMedicineHospitals", JSON.stringify(hospitals));
}

// One-time cleanup requested for the current demo: remove hospitals created by the previous version.
if (!localStorage.getItem("hospitalDirectoryResetV2")) {
    saveHospitals([]);
    localStorage.setItem("hospitalDirectoryResetV2", "1");
}

if (!localStorage.getItem("hospitalDirectoryResetV3")) {
    saveHospitals([]);
    localStorage.setItem("hospitalDirectoryResetV3", "1");
}

function openHospitalModal() {
    const form = document.getElementById("addHospitalForm");
    form.reset();
    document.getElementById("hospitalType").value = "";
    document.querySelectorAll(".hospital-type-option").forEach(button => button.classList.remove("selected"));
    document.getElementById("hospitalModal").classList.add("open");
    setTimeout(() => document.getElementById("hospitalName").focus(), 90);
}

function selectHospitalType(type, button) {
    document.getElementById("hospitalType").value = type;
    document.querySelectorAll(".hospital-type-option").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
}

function closeHospitalModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("hospitalModal").classList.remove("open");
}

function openHospitalInfo(index) {
    const hospital = getHospitals()[index];
    if (!hospital) return;
    const modal = document.getElementById("hospitalInfoModal");
    document.getElementById("infoHospitalName").textContent = hospital.name;
    document.getElementById("infoHospitalType").textContent = hospital.type;
    document.getElementById("infoHospitalLocation").textContent = hospital.location;
    modal.classList.add("open");
}

function closeHospitalInfo(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("hospitalInfoModal").classList.remove("open");
}

let pendingHospitalDelete = -1;
function openHospitalDelete(index) {
    const hospital = getHospitals()[index];
    if (!hospital) return;
    pendingHospitalDelete = index;
    document.getElementById("deleteHospitalName").textContent = hospital.name;
    document.getElementById("deleteHospitalModal").classList.add("open");
}

function closeHospitalDelete(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("deleteHospitalModal").classList.remove("open");
    pendingHospitalDelete = -1;
}

function confirmHospitalDelete() {
    if (pendingHospitalDelete < 0) return;
    const hospitals = getHospitals();
    const removed = hospitals[pendingHospitalDelete];
    if (!removed) return closeHospitalDelete();
    hospitals.splice(pendingHospitalDelete, 1);
    saveHospitals(hospitals);
    renderHospitalDirectory(); updateDashboardData();
    closeHospitalDelete();
    showNotification("Hospital deleted", `${removed.name} was removed from the hospital directory.`);
}

function renderHospitalDirectory() {
    const list = document.getElementById("hospitalDirectoryList");
    if (!list) return;
    const hospitals = getHospitals();
    const count = document.getElementById("hospitalDirectoryCount");
    if (count) count.textContent = `${hospitals.length} Registered Hospital${hospitals.length === 1 ? "" : "s"}`;
    const total = document.getElementById("totalHospitals");
    if (total) total.textContent = hospitals.length;

    if (!hospitals.length) {
        list.innerHTML = `<div class="hospital-empty-state"><span class="empty-state-icon"><svg viewBox="0 0 24 24"><path d="M4 21V8.5L12 4l8 4.5V21M8 21v-4h8v4M9 10h6M12 7v6M9 13h6"/></svg></span><strong>No hospitals registered</strong><small>Use Add Hospital to create the first hospital record.</small></div>`;
        return;
    }

    list.innerHTML = hospitals.map((hospital, index) => `
        <div class="directory-row" tabindex="0">
            <div class="directory-avatar"><svg viewBox="0 0 24 24"><path d="M4 21V8.5L12 4l8 4.5V21M8 21v-4h8v4M9 10h6M12 7v6M9 13h6"/></svg></div>
            <div class="directory-copy"><strong>${escapeHtml(hospital.name)}</strong><small>${escapeHtml(hospital.location)}</small></div>
            <span class="directory-type">${escapeHtml(hospital.type)}</span>
            <div class="directory-actions" aria-label="Hospital actions">
                <button type="button" class="directory-action info-action" onclick="openHospitalInfo(${index})" title="See information" aria-label="See information"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.2v.1"/></svg></button>
                <button type="button" class="directory-action delete-action" onclick="openHospitalDelete(${index})" title="Delete hospital" aria-label="Delete hospital"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M8 7l1 13h6l1-13M10 11v5M14 11v5"/></svg></button>
            </div>
        </div>
    `).join("");
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]));
}

document.getElementById("addHospitalForm")?.addEventListener("submit", function(event) {
    event.preventDefault();
    const name = document.getElementById("hospitalName").value.trim();
    const type = document.getElementById("hospitalType").value;
    const location = document.getElementById("hospitalLocation").value.trim();
    if (!name || !type || !location) {
        showNotification("Missing information", "Select a hospital type and complete the hospital name and location.");
        return;
    }
    const hospitals = getHospitals();
    if (hospitals.some(item => item.name.toLowerCase() === name.toLowerCase())) {
        showNotification("Hospital already exists", "A hospital with this name is already registered.");
        return;
    }
    hospitals.push({ name, type, location });
    saveHospitals(hospitals);
    renderHospitalDirectory(); updateDashboardData();
    closeHospitalModal();
    showNotification("Hospital added", `${name} has been added to the hospital directory.`);
});

function updateDashboardData(){
    const hospitals=getHospitals(), medicines=getMedicines(), outflows=getOutflows();
    const totalHospitals=document.getElementById("totalHospitals"); if(totalHospitals)totalHospitals.textContent=hospitals.length;
    const totalMedicines=document.getElementById("totalMedicines"); if(totalMedicines)totalMedicines.textContent=medicines.length;
    const today=todayISO(), distributedToday=outflows.filter(x=>x.date===today).reduce((s,x)=>s+Number(x.quantity||0),0);
    const dist=document.getElementById("distributedToday"); if(dist)dist.textContent=distributedToday.toLocaleString();
    const low=document.getElementById("lowStockCount"); if(low)low.textContent=medicines.filter(x=>Number(x.stock||0)<=10).length.toLocaleString();
    const hospitalList=document.getElementById("dashboardHospitalList");
    if(hospitalList){const totals=new Map();outflows.forEach(x=>totals.set(x.hospital,(totals.get(x.hospital)||0)+Number(x.quantity||0)));hospitalList.innerHTML=hospitals.length?hospitals.slice(0,6).map(h=>`<div class="hospital-row"><div class="hospital-info"><div class="hospital-avatar">${escapeHtml((h.name||"H").charAt(0).toUpperCase())}</div><div><strong>${escapeHtml(h.name)}</strong><small>${escapeHtml(h.location||h.type||"")}</small></div></div><div class="hospital-number"><strong>${Number(totals.get(h.name)||0).toLocaleString()}</strong><span>units</span></div></div>`).join(""):'<div class="dashboard-empty-state">No hospitals registered yet.</div>';}
    const activity=document.getElementById("dashboardActivityList");
    if(activity){
        const validMedicineNames=new Set(medicines.map(m=>m.name));
        const validHospitalNames=new Set(hospitals.map(h=>h.name));
        const recent=outflows.filter(x=>validMedicineNames.has(x.medicine)&&validHospitalNames.has(x.hospital)).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,6);
        activity.innerHTML=recent.length?recent.map(x=>`<div class="table-row"><span>${escapeHtml(x.medicine)}</span><span>${escapeHtml(x.hospital)}</span><span>${Number(x.quantity||0).toLocaleString()}</span><span>${escapeHtml(formatSmartDate(x.date))}</span><span class="status delivered">Recorded</span></div>`).join(""):'<div class="dashboard-empty-state">No medicine outflow has been recorded yet.</div>';
    }
}

renderHospitalDirectory();

/* =========================================================
   MEDICINE DIRECTORY
========================================================= */
function getMedicines() {
    const saved = localStorage.getItem("districtMedicineMedicines");
    if (saved) {
        try { return JSON.parse(saved) || []; } catch { return []; }
    }
    return [];
}
function saveMedicines(medicines) {
    localStorage.setItem("districtMedicineMedicines", JSON.stringify(medicines));
}

const INITIAL_MEDICINES_FROM_REFERENCE = [
    ["Paracetamol 500mg","TAB"], ["Cinclare 400mg","CAP"], ["Tylofenac 50mg","TAB"], ["Flygl 400mg","TAB"],
    ["Nexum 40mg","CAP"], ["Multibionta-M","CAP"], ["Cipesta 500mg","TAB"], ["Zetro 250mg","TAB"],
    ["Oradin","SYP"], ["Polybion","SYP"], ["Domel 60ml","SYP"], ["Dijex MP 120ml","SYP"],
    ["Paracetamol 120ml","SYP"], ["Zinc day 60ml","SYP"], ["Consome 120ml","SYP"], ["Zetro 200mg/5ml","SYP"],
    ["Cipesta 60ml","SYP"], ["Cefiget DS","SYP"], ["Orxin","OTHER"], ["Dexamethasone 1mg/1ml","INJ"],
    ["Anrob 100ml","OTHER"], ["Drip Set","OTHER"], ["Cordilean","OTHER"], ["Safinol 1ltr","OTHER"]
];

/* Fresh reference-data reset for this release. The supplied image is used only
   for medicine names/categories. No prices, expiry dates or stock quantities
   are imported from the image. Existing hospitals are also cleared; no hospital
   is seeded from the handwritten reference. */
/* Clean reference release: remove every previously stored hospital, medicine and
   outflow record, then seed ONLY the medicine names/categories from the supplied
   reference image. Prices, expiry dates and stock are intentionally blank/zero. */
if (!localStorage.getItem("medicineHospitalReferenceResetV5")) {
    saveHospitals([]);
    localStorage.removeItem("districtMedicineMedicines");
    localStorage.removeItem("districtMedicineOutflows");
    saveMedicines(INITIAL_MEDICINES_FROM_REFERENCE.map(([name,type]) => ({ name, type, stock: 0, expiry: "", price: "" })));
    localStorage.setItem("medicineHospitalReferenceResetV5", "1");
}

let activeMedicineFilter = "ALL";
let activeMedicineMonth = "ALL";
let pendingMedicineDelete = -1;

function openMedicineModal() {
    const form = document.getElementById("addMedicineForm");
    if (form) form.reset();
    document.getElementById("medicineType").value = "";
    document.querySelectorAll("#medicineModal .medicine-type-option").forEach(button => button.classList.remove("selected"));
    document.getElementById("medicineModal").classList.add("open");
    setTimeout(() => document.getElementById("medicineName").focus(), 90);
}
function selectMedicineType(type, button) {
    document.getElementById("medicineType").value = type;
    document.querySelectorAll("#medicineModal .medicine-type-option").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
}
function closeMedicineModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("medicineModal").classList.remove("open");
}
function filterMedicines(filter, button) {
    activeMedicineFilter = filter;
    document.querySelectorAll(".medicine-filter").forEach(item => item.classList.remove("active"));
    if (button) button.classList.add("active");
    renderMedicineDirectory();
}
function formatMedicineExpiry(value) {
    if (!value) return "Not set";
    const date = new Date(value + "T00:00:00");
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { day:"2-digit", month:"short", year:"numeric" });
}
function moneyValue(value){ return Number(value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function openMedicineInfo(index) {
    const items = getMedicines();
    const medicine = items[index];
    if (!medicine) return;
    window.activeMedicineInfoIndex = index;
    document.getElementById("infoMedicineName").textContent = medicine.name;
    document.getElementById("infoMedicineType").textContent = medicine.type;
    document.getElementById("infoMedicineStock").textContent = Number(medicine.stock||0).toLocaleString();
    document.getElementById("infoMedicineExpiry").textContent = formatMedicineExpiry(medicine.expiry);
    document.getElementById("infoMedicinePrice").textContent = medicine.price === "" || medicine.price == null ? "Not set" : `Rs ${moneyValue(medicine.price)}`;
    document.getElementById("medicineInfoModal").classList.add("open");
}
function closeMedicineInfo(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("medicineInfoModal").classList.remove("open");
}
let editingMedicineIndex=-1;
function openMedicineEditFromInfo(){ const index=Number(window.activeMedicineInfoIndex); if(Number.isInteger(index)) openMedicineEdit(index); }
function openMedicineEdit(index){
    const medicine=getMedicines()[index]; if(!medicine)return;
    editingMedicineIndex=index;
    document.getElementById("editMedicineName").value=medicine.name||"";
    document.getElementById("editMedicineStock").value=Number(medicine.stock||0);
    document.getElementById("editMedicineExpiry").value=medicine.expiry||"";
    document.getElementById("editMedicinePrice").value=medicine.price==null?"":medicine.price;
    document.getElementById("editMedicineType").value=medicine.type||"OTHER";
    document.querySelectorAll(".edit-medicine-type-option").forEach(b=>b.classList.toggle("selected",b.textContent.trim()===(medicine.type||"OTHER")));
    document.getElementById("editMedicineModal").classList.add("open");
    document.getElementById("medicineInfoModal")?.classList.remove("open");
}
function selectEditMedicineType(type,button){
    document.getElementById("editMedicineType").value=type;
    document.querySelectorAll(".edit-medicine-type-option").forEach(b=>b.classList.remove("selected"));
    button.classList.add("selected");
}
function closeMedicineEdit(event){ if(event&&event.target!==event.currentTarget)return; document.getElementById("editMedicineModal")?.classList.remove("open"); editingMedicineIndex=-1; }
document.getElementById("editMedicineForm")?.addEventListener("submit",function(e){
    e.preventDefault();
    const name=document.getElementById("editMedicineName").value.trim(), type=document.getElementById("editMedicineType").value, stock=Number(document.getElementById("editMedicineStock").value), expiry=document.getElementById("editMedicineExpiry").value, price=document.getElementById("editMedicinePrice").value;
    if(!name||!type||!Number.isFinite(stock)||stock<0){showNotification("Missing information","Enter a valid medicine name, category and stock.");return;}
    const medicines=getMedicines();
    if(medicines.some((m,i)=>i!==editingMedicineIndex&&m.name.toLowerCase()===name.toLowerCase())){showNotification("Medicine already exists","Another medicine already uses this name.");return;}
    medicines[editingMedicineIndex]={...medicines[editingMedicineIndex],name,type,stock,expiry,price:price===""?"":Number(price)};
    saveMedicines(medicines); renderMedicineDirectory(); updateDashboardData(); closeMedicineEdit(); showNotification("Medicine updated",`${name} was updated successfully.`);
});
function openMedicineDelete(index) {
    const medicine = getMedicines()[index]; if (!medicine) return;
    pendingMedicineDelete = index; document.getElementById("deleteMedicineName").textContent = medicine.name; document.getElementById("deleteMedicineModal").classList.add("open");
}
function closeMedicineDelete(event) { if (event && event.target !== event.currentTarget) return; document.getElementById("deleteMedicineModal").classList.remove("open"); pendingMedicineDelete = -1; }
function confirmMedicineDelete() {
    if (pendingMedicineDelete < 0) return;
    const medicines = getMedicines(), removed = medicines[pendingMedicineDelete]; if (!removed) return closeMedicineDelete();
    medicines.splice(pendingMedicineDelete, 1); saveMedicines(medicines); renderMedicineDirectory(); updateDashboardData(); closeMedicineDelete(); showNotification("Medicine deleted", `${removed.name} was removed from the medicine directory.`);
}
function filterMedicineMonth(month, button) { activeMedicineMonth = String(month); document.querySelectorAll(".month-filter").forEach(item => item.classList.remove("active")); if (button) button.classList.add("active"); renderMedicineDirectory(); }
function updateMedicineStock(index, value){ const medicines=getMedicines(); if(!medicines[index])return; medicines[index].stock=Math.max(0,Math.floor(Number(value)||0)); saveMedicines(medicines); renderMedicineDirectory(); updateDashboardData(); }
function startInlineStockEdit(index, button){
    const current=Number(getMedicines()[index]?.stock||0); const input=document.createElement("input"); input.type="number"; input.min="0"; input.step="1"; input.value=current; input.className="medicine-inline-stock-input"; button.replaceWith(input); input.focus(); input.select();
    let done=false; const finish=(save=true)=>{if(done)return;done=true;if(save)updateMedicineStock(index,input.value);else renderMedicineDirectory();};
    input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();finish(true)}else if(e.key==="Escape"){e.preventDefault();finish(false)}}); input.addEventListener("blur",()=>finish(true));
}
function startMedicineSearch(input){
    const box=document.getElementById("medicineDirectoryResults"); if(!box)return; const query=(input.value||"").trim().toLowerCase(); const medicines=getMedicines().filter(m=>!query||m.name.toLowerCase().startsWith(query));
    if(!query){box.hidden=true;box.innerHTML="";return;}
    box.innerHTML=medicines.slice(0,12).map(m=>`<button type="button" class="medicine-search-result" data-name="${escapeHtml(m.name)}"><span class="result-med-icon">${escapeHtml(m.type)}</span><span><strong>${escapeHtml(m.name)}</strong><small>Stock ${Number(m.stock||0).toLocaleString()} • ${escapeHtml(m.type)}</small></span><b>›</b></button>`).join("")||'<div class="medicine-search-empty">No matching medicines</div>'; box.hidden=false;
    box.querySelectorAll(".medicine-search-result").forEach(btn=>btn.addEventListener("click",()=>{input.value=btn.dataset.name;box.hidden=true;renderMedicineDirectory();}));
}
function renderMedicineDirectory() {
    const list=document.getElementById("medicineDirectoryList"); if(!list)return; const medicines=getMedicines();
    const count=document.getElementById("medicineDirectoryCount"); if(count)count.textContent=`${medicines.length} Medicine & Stock Record${medicines.length===1?"":"s"}`; const total=document.getElementById("totalMedicines"); if(total)total.textContent=medicines.length;
    const search=(document.getElementById("medicineDirectorySearch")?.value||"").trim().toLowerCase(); let filtered=activeMedicineFilter==="ALL"?medicines:medicines.filter(m=>m.type===activeMedicineFilter);
    if(activeMedicineMonth!=="ALL")filtered=filtered.filter(m=>{const d=m.expiry?new Date(m.expiry+"T00:00:00"):null;return d&&!Number.isNaN(d.getTime())&&d.getMonth()+1===Number(activeMedicineMonth)}); if(search)filtered=filtered.filter(m=>m.name.toLowerCase().startsWith(search));
    if(!filtered.length){list.innerHTML=`<div class="medicine-empty-state"><span class="empty-state-icon"><svg viewBox="0 0 24 24"><path d="M7.5 4.5a4 4 0 0 1 5.66 0l6.34 6.34a4 4 0 0 1 0 5.66l-1 1a4 4 0 0 1-5.66 0L6.5 11.16a4 4 0 0 1 0-5.66zM8 8l8 8"/></svg></span><strong>No medicines found</strong><small>${search?"Try another medicine name.":"Use Add Medicine to create a medicine record."}</small></div>`;return;}
    list.innerHTML=filtered.map(m=>{const i=medicines.indexOf(m),price=m.price===""||m.price==null?"Not set":`Rs ${moneyValue(m.price)}`;return `<div class="medicine-row" tabindex="0"><span class="medicine-sno">${i+1}</span><div class="medicine-product"><strong>${escapeHtml(m.name)}</strong><small>Medicine &amp; stock record</small></div><span class="medicine-expiry">${escapeHtml(formatMedicineExpiry(m.expiry))}</span><span class="medicine-category">${escapeHtml(m.type)}</span><button type="button" class="medicine-stock medicine-stock-button" onclick="startInlineStockEdit(${i}, this)" title="Click to change stock">${Number(m.stock||0).toLocaleString()}</button><span class="medicine-unit-price">${escapeHtml(price)}</span><div class="medicine-actions" aria-label="Medicine actions"><button type="button" class="directory-action edit-action" onclick="openMedicineEdit(${i})" title="Edit medicine" aria-label="Edit medicine"><svg viewBox="0 0 24 24"><path d="M4 20h5L20 9l-5-5L4 15v5zM13.5 5.5l5 5"/></svg></button><button type="button" class="directory-action info-action" onclick="openMedicineInfo(${i})" title="See information" aria-label="See information"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.2v.1"/></svg></button><button type="button" class="directory-action delete-action" onclick="openMedicineDelete(${i})" title="Delete medicine" aria-label="Delete medicine"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M8 7l1 13h6l1-13M10 11v5M14 11v5"/></svg></button></div></div>`}).join("");
}
document.getElementById("medicineDirectorySearch")?.addEventListener("input",function(){startMedicineSearch(this);renderMedicineDirectory();});
document.addEventListener("click",e=>{const box=document.getElementById("medicineDirectoryResults"),input=document.getElementById("medicineDirectorySearch");if(box&&!box.hidden&&!box.contains(e.target)&&e.target!==input)box.hidden=true;});
document.getElementById("addMedicineForm")?.addEventListener("submit",function(event){
    event.preventDefault(); const name=document.getElementById("medicineName").value.trim(), type=document.getElementById("medicineType").value, stock=document.getElementById("medicineStock").value, expiry=document.getElementById("medicineExpiry").value, price=document.getElementById("medicinePrice").value;
    if(!name||!type||stock===""||Number(stock)<0){showNotification("Missing information","Select a medicine type and complete the medicine name and stock.");return;} const medicines=getMedicines();
    if(medicines.some(item=>item.name.toLowerCase()===name.toLowerCase())){showNotification("Medicine already exists","A medicine with this name is already registered.");return;}
    medicines.push({name,type,stock:Number(stock),expiry,price:price===""?"":Number(price)}); saveMedicines(medicines); renderMedicineDirectory(); updateDashboardData(); closeMedicineModal(); showNotification("Medicine added",`${name} has been added to Medicines & Stock.`);
});
renderMedicineDirectory();

/* =========================================================
   MEDICINE OUTFLOW
========================================================= */
let outflowDraft = [];
let editingOutflowIndex = -1;
let pendingOutflowDelete = -1;
let outflowFree = false;
let editOutflowFree = false;
let outflowMedicineCategory = "ALL";
let editOutflowMedicineCategory = "ALL";

function getOutflows(){
    try {
        const parsed = JSON.parse(localStorage.getItem("districtMedicineOutflows") || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not read medicine outflow records:", error);
        return [];
    }
}
function saveOutflows(items){
    if (!Array.isArray(items)) throw new TypeError("Outflow records must be a list.");
    localStorage.setItem("districtMedicineOutflows", JSON.stringify(items));
    // Verify persistence so the interface never reports success for an unsaved distribution.
    const saved = JSON.parse(localStorage.getItem("districtMedicineOutflows") || "[]");
    if (!Array.isArray(saved) || saved.length !== items.length) throw new Error("The outflow records could not be saved. Please check available browser storage and try again.");
}
function formatSmartDate(value){
    if(!value)return "—"; const target=new Date(value+"T00:00:00"); if(Number.isNaN(target.getTime()))return value;
    const today=new Date(); today.setHours(0,0,0,0); const yesterday=new Date(today); yesterday.setDate(yesterday.getDate()-1);
    if(target.getTime()===today.getTime())return "Today"; if(target.getTime()===yesterday.getTime())return "Yesterday";
    return target.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});
}
function todayISO(){ const d=new Date(); const off=d.getTimezoneOffset(); return new Date(d.getTime()-off*60000).toISOString().slice(0,10); }
function openOutflowModal(){
    outflowFinishInProgress=false;
    const finishButton=document.querySelector("#outflowModal .outflow-finish-btn");if(finishButton){finishButton.disabled=false;finishButton.classList.remove("is-processing");}
    outflowDraft=[]; outflowFree=false; outflowMedicineCategory="ALL";
    document.getElementById("outflowModal").classList.add("open");
    document.getElementById("outflowModal").setAttribute("aria-hidden","false");
    document.getElementById("outflowDate").value=todayISO();
    document.getElementById("outflowQuantity").value=""; document.getElementById("outflowPrice").value="";
    document.getElementById("outflowMedicineSearch").value="";
    document.getElementById("outflowHospitalType").value=""; document.getElementById("outflowHospital").innerHTML='<option value="">Select hospital</option>';
    document.querySelectorAll("#outflowModal .outflow-category-chip").forEach((b)=>b.classList.toggle("active",b.dataset.category==="ALL"));
    setOutflowFree(false); renderOutflowMedicineOptions(); renderOutflowDraft();
}
function closeOutflowModal(event){ if(event && event.target!==event.currentTarget)return; const modal=document.getElementById("outflowModal"); if(modal){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");} outflowDraft=[]; }
function setOutflowMedicineCategory(category, button){
    outflowMedicineCategory=category||"ALL";
    document.querySelectorAll("#outflowModal .outflow-category-chip").forEach(b=>b.classList.toggle("active",b===button || b.dataset.category===outflowMedicineCategory));
    renderOutflowMedicineOptions();
}
function renderOutflowMedicineOptions(){
    const select=document.getElementById("outflowMedicine"), search=(document.getElementById("outflowMedicineSearch")?.value||"").trim().toLowerCase();
    const medicines=getMedicines().filter(m=>{
        const name=String(m.name||"").toLowerCase();
        const type=String(m.type||"OTHER").toUpperCase();
        return (!search || name.startsWith(search)) && (outflowMedicineCategory==="ALL" || type===outflowMedicineCategory);
    });
    select.innerHTML='<option value="">Select medicine</option>'+medicines.map(m=>`<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)} — ${escapeHtml(m.type)} — Stock ${escapeHtml(m.stock)}</option>`).join("");
    const box=document.getElementById("outflowMedicineResults");
    if(box){
        if(!search){box.hidden=true;box.innerHTML="";}else{
            box.innerHTML=medicines.slice(0,12).map(m=>{
                const stock=Number(m.stock||0);
                const available=stock>0;
                return `<button type="button" class="medicine-search-result${available?"":" zero-stock"}" data-name="${escapeHtml(m.name)}"><span class="result-med-icon">${escapeHtml(m.type)}</span><span><strong>${escapeHtml(m.name)}</strong><small>${available?`Available stock ${stock.toLocaleString()}`:"Stock 0 — add stock before outflow"}</small></span><b>›</b></button>`;
            }).join("")||'<div class="medicine-search-empty">No matching medicine found</div>';
            box.hidden=false;
            box.querySelectorAll(".medicine-search-result").forEach(btn=>btn.addEventListener("click",()=>{
                const med=getMedicines().find(m=>m.name===btn.dataset.name);
                if(!med)return;
                if(Number(med.stock||0)<=0){showNotification("No stock available",`${med.name} currently has 0 stock. Update its stock in Medicines & Stock first.`);return;}
                select.value=btn.dataset.name;
                document.getElementById("outflowMedicineSearch").value=btn.dataset.name;
                box.hidden=true;
                if(med.price!==""&&document.getElementById("outflowPrice").value==="")document.getElementById("outflowPrice").value=med.price;
            }));
        }
    }
}

document.getElementById("outflowMedicineSearch")?.addEventListener("input",renderOutflowMedicineOptions);
document.addEventListener("click",e=>{const box=document.getElementById("outflowMedicineResults"),input=document.getElementById("outflowMedicineSearch");if(box&&!box.hidden&&!box.contains(e.target)&&e.target!==input)box.hidden=true;});

function populateOutflowHospitals(){ const type=document.getElementById("outflowHospitalType").value; const sel=document.getElementById("outflowHospital"); const hs=getHospitals().filter(h=>!type||h.type===type); sel.innerHTML='<option value="">Select hospital</option>'+hs.map(h=>`<option value="${escapeHtml(h.name)}">${escapeHtml(h.name)}</option>`).join(""); }
function setOutflowFree(value){ outflowFree=value; const b=document.getElementById("outflowFreeButton"); if(b)b.classList.toggle("selected",value); const p=document.getElementById("outflowPrice"); if(p){p.disabled=value;p.value=value?"0":p.value;} }
function toggleOutflowFree(){ setOutflowFree(!outflowFree); }
function addOutflowDraft(){
    const name=document.getElementById("outflowMedicine").value, qty=Number(document.getElementById("outflowQuantity").value), date=document.getElementById("outflowDate").value;
    const price=outflowFree?0:Number(document.getElementById("outflowPrice").value||0), hospitalType=document.getElementById("outflowHospitalType").value, hospital=document.getElementById("outflowHospital").value;
    const med=getMedicines().find(m=>m.name===name);
    if(!med||!qty||qty<1||!date||!hospitalType||!hospital||(!outflowFree && document.getElementById("outflowPrice").value==="")){ showNotification("Missing information","Select a medicine, quantity, date, price/free option and hospital."); return; }
    const reserved=outflowDraft.filter(x=>x.medicine===name).reduce((s,x)=>s+x.quantity,0);
    if(qty+reserved>Number(med.stock)){ showNotification("Insufficient stock",`Only ${med.stock-reserved} units are available for ${med.name}.`); return; }
    outflowDraft.push({medicine:med.name,type:med.type,quantity:qty,date,price,free:outflowFree,hospitalType,hospital});
    renderOutflowDraft();
    document.getElementById("outflowMedicineSearch").value=""; renderOutflowMedicineOptions(); document.getElementById("outflowQuantity").value=""; document.getElementById("outflowDate").value=todayISO(); document.getElementById("outflowPrice").value=""; setOutflowFree(false);
    showNotification("Added to list",`${med.name} was added to the current outflow.`);
}
function renderOutflowDraft(){ const list=document.getElementById("outflowDraftList"), count=document.getElementById("outflowDraftCount"); if(count)count.textContent=`${outflowDraft.length} item${outflowDraft.length===1?"":"s"}`; if(!list)return; list.innerHTML=outflowDraft.length?outflowDraft.map((x,i)=>`<div class="outflow-draft-row"><span>${escapeHtml(x.medicine)}</span><span>${x.type}</span><span>${x.quantity}</span><span>${escapeHtml(x.hospital)}</span><span>${formatSmartDate(x.date)}</span><span>${x.free?"Free":escapeHtml(String(x.price))}</span><button type="button" onclick="removeOutflowDraft(${i})" title="Remove"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>`).join(""):'<div class="outflow-draft-empty">No medicines added yet. Select a medicine and press Next.</div>'; }
function removeOutflowDraft(i){ outflowDraft.splice(i,1); renderOutflowDraft(); }
function finishOutflow(){
    if(outflowFinishInProgress)return;
    if(!outflowDraft.length){showNotification("Nothing to finish","Add at least one medicine to the outflow list.");return;}

    outflowFinishInProgress=true;
    const finishButton=document.querySelector("#outflowModal .outflow-finish-btn");
    if(finishButton){finishButton.disabled=true;finishButton.classList.add("is-processing");}

    // Capture the draft and storage snapshots before changing anything. This
    // lets us recover cleanly if the browser refuses to save either record.
    const draft=[...outflowDraft].map(item=>({...item}));
    const oldMedicinesRaw=localStorage.getItem("districtMedicineMedicines");
    const oldOutflowsRaw=localStorage.getItem("districtMedicineOutflows");
    try{
        const medicines=getMedicines();
        for(const item of draft){
            const med=medicines.find(entry=>entry.name===item.medicine);
            if(!med||Number(med.stock)<Number(item.quantity)){
                throw new Error("One of the medicines no longer has enough stock. Please review the outflow and try again.");
            }
        }

        const batchId="OUT-"+Date.now()+"-"+Math.random().toString(36).slice(2,8);
        draft.forEach(item=>{
            const med=medicines.find(entry=>entry.name===item.medicine);
            med.stock=Number(med.stock)-Number(item.quantity);
        });
        const all=getOutflows();
        draft.forEach((item,index)=>all.push({...item,id:`${batchId}-${index+1}`,batchId}));

        // Persist both pieces of data before refreshing any UI. Rendering errors
        // must never leave the entry tab stuck in its processing state.
        saveMedicines(medicines);
        saveOutflows(all);
        latestOutflowReportBatchId=batchId;

        // Confirm that the completed batch is actually present in storage before closing.
        const persisted = getOutflows();
        if (!persisted.some(item => String(item.batchId || "") === batchId)) {
            throw new Error("The distribution was not found after saving. Please try again.");
        }
        const modal=document.getElementById("outflowModal");
        if(modal){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");}
        outflowDraft=[];
        outflowFinishInProgress=false;
        if(finishButton){finishButton.disabled=false;finishButton.classList.remove("is-processing");}

        // Reset old directory filters so the newly completed hospital distribution
        // cannot be hidden by a previously selected hospital, month, or year.
        ["outflowDirectorySearch","outflowDirectoryType","outflowDirectoryHospital","outflowDirectoryMonth","outflowDirectoryYear"].forEach(id=>{
            const el=document.getElementById(id);
            if(el)el.value=id==="outflowDirectorySearch"?"":"ALL";
        });
        const safeRefresh=(fn)=>{try{if(typeof fn==="function")fn();}catch(error){console.error("Outflow refresh error:",error);}};
        safeRefresh(renderMedicineDirectory);
        safeRefresh(renderOutflowDirectory);
        safeRefresh(updateDashboardData);
        safeRefresh(renderMonthlyRecords);
        // Re-render once more after the browser finishes closing the mini-tab.
        requestAnimationFrame(()=>{
            safeRefresh(renderOutflowDirectory);
            safeRefresh(renderMonthlyRecords);
        });
        showNotification("Medicine outflow completed","The distribution has been saved and is visible in the hospital directory and monthly report.");
    }catch(error){
        // Roll back a partial save, but retain the user's draft so they can retry.
        try{
            if(oldMedicinesRaw===null)localStorage.removeItem("districtMedicineMedicines");
            else localStorage.setItem("districtMedicineMedicines",oldMedicinesRaw);
            if(oldOutflowsRaw===null)localStorage.removeItem("districtMedicineOutflows");
            else localStorage.setItem("districtMedicineOutflows",oldOutflowsRaw);
        }catch(rollbackError){console.error("Could not roll back outflow storage:",rollbackError);}
        outflowFinishInProgress=false;
        if(finishButton){finishButton.disabled=false;finishButton.classList.remove("is-processing");}
        showNotification("Outflow not completed",error?.message||"The distribution could not be saved. Please try again.");
    }
}


/* =========================================================
   OUTLOW WORD REPORT GENERATOR
   Creates a real editable .DOCX report matching the supplied
   computer-printed reference layout. Handwritten values are
   intentionally not reproduced.
========================================================= */
let latestOutflowReportBatchId="";
let outflowFinishInProgress=false;

function wordXmlEscape(value){
    return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function reportDosageForm(type){
    return ({TAB:"Tablets",SYP:"Syrup",CAP:"Capsule",INJ:"Injection",OTHER:"Miscellaneous"}[String(type||"").toUpperCase()]||String(type||"Miscellaneous"));
}
function reportMoney(value){
    const n=Number(value||0);
    return n.toLocaleString("en-US",{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2});
}
function reportDateLong(value){
    if(!value)return "";
    const d=new Date(String(value)+"T00:00:00");
    if(Number.isNaN(d.getTime()))return String(value);
    return d.toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"});
}
function reportTypeLabel(type){ return type==="RHC"?"RHCs":type==="MCH"?"MCHs":type==="CD"?"CDs":String(type||""); }
function reportRecordsForBatch(batchId){
    const all=getOutflows();
    const legacyGroupKey=x=>`LEGACY-${String(x.hospital||"").trim().toLowerCase()}|${String(x.hospitalType||"").trim().toLowerCase()}|${String(x.date||"")}`;
    return all.filter(x=>String(x.batchId||legacyGroupKey(x))===String(batchId));
}
function reportXmlRun(text,{bold=false,size=20,font="Arial",color="000000",italic=false}={}){
    return `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:sz w:val="${size}"/>${bold?"<w:b/>":""}${italic?"<w:i/>":""}<w:color w:val="${color}"/></w:rPr><w:t xml:space="preserve">${wordXmlEscape(text)}</w:t></w:r>`;
}
function reportParagraph(text="",opts={}){
    const align=opts.align||"left", before=opts.before||0, after=opts.after||0, line=opts.line||240;
    return `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="${before}" w:after="${after}" w:line="${line}"/></w:pPr>${reportXmlRun(text,opts)}</w:p>`;
}
function reportCell(text,opts={}){
    const width=opts.width||1200, bold=!!opts.bold, size=opts.size||18, align=opts.align||"left", shading=opts.shading||"FFFFFF", valign=opts.valign||"center", color=opts.color||"000000";
    const margins='<w:tcMar><w:top w:w="45" w:type="dxa"/><w:left w:w="55" w:type="dxa"/><w:bottom w:w="45" w:type="dxa"/><w:right w:w="55" w:type="dxa"/></w:tcMar>';
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:shd w:fill="${shading}"/><w:vAlign w:val="${valign}"/>${margins}</w:tcPr><w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:after="0"/></w:pPr>${reportXmlRun(text,{bold,size,font:"Arial",color})}</w:p></w:tc>`;
}
function reportTable(rows,widths,header=false){
    const borders='<w:tblBorders><w:top w:val="single" w:sz="8" w:color="000000"/><w:left w:val="single" w:sz="8" w:color="000000"/><w:bottom w:val="single" w:sz="8" w:color="000000"/><w:right w:val="single" w:sz="8" w:color="000000"/><w:insideH w:val="single" w:sz="6" w:color="000000"/><w:insideV w:val="single" w:sz="6" w:color="000000"/></w:tblBorders>';
    const grid=widths.map(w=>`<w:gridCol w:w="${w}"/>`).join("");
    return `<w:tbl><w:tblPr><w:tblW w:w="10800" w:type="dxa"/>${borders}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="20" w:type="dxa"/><w:left w:w="25" w:type="dxa"/><w:bottom w:w="20" w:type="dxa"/><w:right w:w="25" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rows.map((r,ri)=>`<w:tr>${r.map((c,ci)=>reportCell(c,{width:widths[ci],bold:header||ri===rows.length-1,size:header?16:15,align:ci===0||ci===3||ci===4||ci===5||ci===6?"center":"left",shading:header?"E7E7E7":"FFFFFF"})).join("")}</w:tr>`).join("")}</w:tbl>`;
}
async function buildOutflowWordReport(records){
    if(!records.length)throw new Error("No report records found.");
    if(!window.JSZip)throw new Error("Word document engine is unavailable.");
    const hospital=records[0].hospital||"";
    const type=records[0].hospitalType||"";
    const date=records[0].date||todayISO();
    const total=records.reduce((sum,x)=>sum+(x.free?0:Number(x.quantity||0)*Number(x.price||0)),0);
    const itemCount=records.length;
    const totalUnits=records.reduce((sum,x)=>sum+Number(x.quantity||0),0);
    const tableRows=[
        ["S.No","Dosage Form","Item Name","Unit Price","Quantity Issued","Total Amount (PKR)","R.P No"],
        ...records.map((x,i)=>[
            String(i+1),
            reportDosageForm(x.type),
            x.medicine||"",
            x.free?"0":reportMoney(x.price),
            Number(x.quantity||0).toLocaleString("en-US"),
            x.free?"FREE DONATIONS":reportMoney(Number(x.quantity||0)*Number(x.price||0)),
            ""
        ])
    ];
    const tableWidth=[650,1500,3300,1050,1200,1900,1200];
    const bodyParts=[];
    bodyParts.push(reportParagraph(`DISTRICT HEALTH OFFICE, QUETTA (${reportTypeLabel(type)})`,{align:"center",bold:true,size:27,after:55}));
    bodyParts.push(`<w:tbl><w:tblPr><w:tblW w:w="10800" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="5400"/><w:gridCol w:w="5400"/></w:tblGrid><w:tr>${reportCell(`Center Name:  ${hospital}`,{width:5400,bold:true,size:17})}${reportCell(`Dated:  ${reportDateLong(date)}`,{width:5400,bold:true,size:17,align:"right"})}</w:tr></w:tbl>`);
    bodyParts.push(reportTable(tableRows,tableWidth,true));
    bodyParts.push(reportParagraph(`TOTAL AMOUNT =  ${reportMoney(total)}/-`,{align:"right",bold:true,size:18,before:20,after:30}));
    const footerRows=[
        ["Issued By: DMS(QTA)","Received By:","Post Held:"],
        ["Cell No:","Signature:","NIC No:"]
    ];
    bodyParts.push(`<w:tbl><w:tblPr><w:tblW w:w="10800" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="8" w:color="000000"/><w:left w:val="single" w:sz="8" w:color="000000"/><w:bottom w:val="single" w:sz="8" w:color="000000"/><w:right w:val="single" w:sz="8" w:color="000000"/><w:insideH w:val="single" w:sz="6" w:color="000000"/><w:insideV w:val="single" w:sz="6" w:color="000000"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3600"/><w:gridCol w:w="3600"/><w:gridCol w:w="3600"/></w:tblGrid>${footerRows.map(r=>`<w:tr>${r.map((c,i)=>reportCell(c,{width:3600,bold:true,size:16})).join("")}</w:tr>`).join("")}</w:tbl>`);
    bodyParts.push(reportParagraph(`•  I have Received  ${itemCount.toLocaleString("en-US")}  Items from District Main Pharmacy for  ${hospital}  in full Quantity.`,{size:17,before:80,after:0}));
    const documentXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyParts.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="480" w:right="540" w:bottom="480" w:left="540" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const stylesXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`;
    const settingsXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/></w:settings>`;
    const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>`;
    const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    const docRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;
    const zip=new JSZip();
    zip.file("[Content_Types].xml",contentTypes);
    zip.folder("_rels").file(".rels",rels);
    const word=zip.folder("word");
    word.file("document.xml",documentXml);
    word.file("styles.xml",stylesXml);
    word.file("settings.xml",settingsXml);
    word.folder("_rels").file("document.xml.rels",docRels);
    const safeHospital=(hospital||"Hospital").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"")||"Hospital";
    const safeDate=String(date).replace(/[^0-9-]/g,"");
    const fileName=`Medicine-Supply-Report-${safeHospital}-${safeDate}.docx`;
    const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE"});
    return {blob,fileName,hospital,type,date,items:itemCount};
}
async function downloadOutflowReportByBatch(batchId){
    try{
        const records=reportRecordsForBatch(batchId);
        if(!records.length){showNotification("Report unavailable","No outflow records were found for this report.");return;}
        const report=await buildOutflowWordReport(records);
        const url=URL.createObjectURL(report.blob),a=document.createElement("a");
        a.href=url;a.download=report.fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
        showNotification("Word report downloaded","The complete computer-generated supply report has been downloaded.");
    }catch(error){console.error(error);showNotification("Report error","The Word report could not be generated. Please try again.");}
}
function showOutflowReportReady(batchId,items){
    latestOutflowReportBatchId=batchId;
    const first=items[0]||{};
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value||"—";};
    set("outflowReportHospital",first.hospital);
    set("outflowReportHospitalType",first.hospitalType);
    set("outflowReportDate",reportDateLong(first.date));
    set("outflowReportItems",items.length.toLocaleString("en-US")+` medicine${items.length===1?"":"s"}`);
    document.getElementById("outflowReportModal")?.classList.add("open");
}
function closeOutflowReportModal(e){if(e&&e.target!==e.currentTarget)return;document.getElementById("outflowReportModal")?.classList.remove("open");}
function downloadLatestOutflowReport(){if(!latestOutflowReportBatchId){showNotification("Report unavailable","No completed outflow report is ready.");return;}downloadOutflowReportByBatch(latestOutflowReportBatchId);}
function setEditOutflowMedicineCategory(category, button){
    editOutflowMedicineCategory=category||"ALL";
    document.querySelectorAll("#editOutflowModal .outflow-category-chip").forEach(b=>b.classList.toggle("active",b===button || b.dataset.category===editOutflowMedicineCategory));
    renderEditOutflowMedicineOptions();
}
function renderEditOutflowMedicineOptions(){
    const select=document.getElementById("editOutflowMedicine");
    const input=document.getElementById("editOutflowMedicineSearch");
    const box=document.getElementById("editOutflowMedicineResults");
    if(!select)return;
    const search=(input?.value||"").trim().toLowerCase();
    const medicines=getMedicines().filter(m=>{
        const name=String(m.name||"").toLowerCase();
        const type=String(m.type||"OTHER").toUpperCase();
        return (!search || name.startsWith(search)) && (editOutflowMedicineCategory==="ALL" || type===editOutflowMedicineCategory);
    });
    const current=select.value;
    select.innerHTML='<option value="">Select medicine</option>'+medicines.map(m=>`<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)} — ${escapeHtml(m.type)} — Stock ${escapeHtml(m.stock)}</option>`).join("");
    if(current && medicines.some(m=>m.name===current)) select.value=current;
    if(box){
        if(!search){box.hidden=true;box.innerHTML="";return;}
        box.innerHTML=medicines.slice(0,12).map(m=>{const stock=Number(m.stock||0);return `<button type="button" class="medicine-search-result${stock>0?"":" zero-stock"}" data-name="${escapeHtml(m.name)}"><span class="result-med-icon">${escapeHtml(m.type)}</span><span><strong>${escapeHtml(m.name)}</strong><small>${stock>0?`Available stock ${stock.toLocaleString()}`:"Stock 0 — add stock before outflow"}</small></span><b>›</b></button>`;}).join("")||'<div class="medicine-search-empty">No matching medicine found</div>';
        box.hidden=false;
        box.querySelectorAll(".medicine-search-result").forEach(btn=>btn.addEventListener("click",()=>{
            const med=getMedicines().find(m=>m.name===btn.dataset.name);
            if(!med)return;
            select.value=btn.dataset.name;
            select.dispatchEvent(new Event("change",{bubbles:true}));
            if(input)input.value=btn.dataset.name;
            box.hidden=true;
        }));
    }
}
document.getElementById("editOutflowMedicineSearch")?.addEventListener("input",renderEditOutflowMedicineOptions);
document.addEventListener("click",e=>{const box=document.getElementById("editOutflowMedicineResults"),input=document.getElementById("editOutflowMedicineSearch");if(box&&!box.hidden&&!box.contains(e.target)&&e.target!==input)box.hidden=true;});

let pendingOutflowDeleteBatchId="";
let activeOutflowInfoBatchId="";
function getOutflowGroups(){
    const items=getOutflows();
    const groups=new Map();
    items.forEach((x,index)=>{
        // Older saved records did not have a batchId. Group those by the
        // distribution identity so one hospital/date distribution stays one row.
        const legacyKey = `LEGACY-${String(x.hospital||"").trim().toLowerCase()}|${String(x.hospitalType||"").trim().toLowerCase()}|${String(x.date||"")}`;
        const key=String(x.batchId||legacyKey);
        if(!groups.has(key))groups.set(key,{key,batchId:x.batchId||key,items:[],first:x});
        groups.get(key).items.push({...x,__index:index});
    });
    return Array.from(groups.values()).sort((a,b)=>{
        const da=String(a.items[0]?.date||"");
        const db=String(b.items[0]?.date||"");
        return db.localeCompare(da) || String(b.items[0]?.id||"").localeCompare(String(a.items[0]?.id||""));
    });
}
function outflowGroupTotal(group){return group.items.reduce((sum,x)=>sum+(x.free?0:Number(x.price||0)*Number(x.quantity||0)),0);}
function outflowGroupUnits(group){return group.items.reduce((sum,x)=>sum+Number(x.quantity||0),0);}
function openOutflowInfoByDirectoryIndex(index){ const group=getOutflowGroups()[Number(index)]; if(group) openOutflowInfo(group.key); }
function openOutflowInfo(groupKey){
    const group=getOutflowGroups().find(g=>String(g.key)===String(groupKey));
    if(!group)return;
    activeOutflowInfoBatchId=String(group.batchId||group.key);
    const first=group.items[0]||{};
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value==null||value===""?"—":value;};
    set("infoOutflowHospital",first.hospital);
    set("infoOutflowHospitalType",first.hospitalType);
    set("infoOutflowDate",formatSmartDate(first.date));
    set("infoOutflowMedicineCount",group.items.length.toLocaleString());
    set("infoOutflowQuantity",outflowGroupUnits(group).toLocaleString());
    set("infoOutflowPrice",outflowGroupTotal(group)>0?`Rs ${moneyValue(outflowGroupTotal(group))}`:"Free / Donations");
    const list=document.getElementById("infoOutflowMedicineList");
    if(list){
        list.innerHTML=group.items.map((x)=>{
            const med=getMedicines().find(m=>m.name===x.medicine);
            const currentStock=med?Number(med.stock||0).toLocaleString():"—";
            const expiry=med?.expiry?formatMedicineExpiry(med.expiry):"Not set";
            return `<div class="outflow-info-medicine-card">
            <div class="outflow-info-medicine-main"><span class="outflow-info-type">${escapeHtml(x.type||"OTHER")}</span><div><strong>${escapeHtml(x.medicine)}</strong><small>${escapeHtml(reportDosageForm(x.type))}</small></div></div>
            <div class="outflow-info-medicine-meta"><span><b>Quantity Supplied</b>${Number(x.quantity||0).toLocaleString()}</span><span><b>Unit Price</b>${x.free?"Free":`Rs ${moneyValue(x.price)}`}</span><span><b>Total Value</b>${x.free?"Free":`Rs ${moneyValue(Number(x.price||0)*Number(x.quantity||0))}`}</span><span><b>Current Stock</b>${currentStock}</span><span><b>Expiry</b>${escapeHtml(expiry)}</span></div>
            <button type="button" class="directory-action edit-action" onclick="openEditOutflowByRecordId('${escapeHtml(String(x.id))}')" title="Edit medicine" aria-label="Edit medicine"><svg viewBox="0 0 24 24"><path d="M4 20h5L20 9l-5-5L4 15v5zM13.5 5.5l5 5"/></svg></button>
        </div>`;}).join("");
    }
    document.getElementById("outflowInfoModal")?.classList.add("open");
}
function closeOutflowInfo(e){if(e&&e.target!==e.currentTarget)return;document.getElementById("outflowInfoModal")?.classList.remove("open");activeOutflowInfoBatchId="";}
function downloadInfoOutflowReport(){if(activeOutflowInfoBatchId)downloadOutflowReportByBatch(activeOutflowInfoBatchId);}
function openEditOutflowByRecordId(recordId){
    const index=getOutflows().findIndex(x=>String(x.id)===String(recordId));
    if(index<0)return;
    closeOutflowInfo();
    openEditOutflow(index);
}
function openOutflowDelete(groupKey){
    const group=getOutflowGroups().find(g=>String(g.key)===String(groupKey));
    if(!group)return;
    pendingOutflowDeleteBatchId=String(group.batchId||group.key);
    const first=group.items[0]||{};
    const totalUnits=outflowGroupUnits(group);
    const title=group.items.length>1?`${first.hospital} — ${group.items.length} medicines`:`${first.medicine} → ${first.hospital}`;
    document.getElementById("deleteOutflowName").textContent=title;
    const p=document.querySelector("#deleteOutflowModal .delete-confirm-modal > p");
    if(p)p.innerHTML=`Deleting <strong>${escapeHtml(title)}</strong> will return <strong>${totalUnits.toLocaleString()} units</strong> to medicine stock.`;
    document.getElementById("deleteOutflowModal")?.classList.add("open");
}
function closeOutflowDelete(e){if(e&&e.target!==e.currentTarget)return;document.getElementById("deleteOutflowModal")?.classList.remove("open");pendingOutflowDeleteBatchId="";}
function confirmOutflowDelete(){
    if(!pendingOutflowDeleteBatchId)return;
    const items=getOutflows();
    const key=pendingOutflowDeleteBatchId;
    const legacyGroupKey=x=>`LEGACY-${String(x.hospital||"").trim().toLowerCase()}|${String(x.hospitalType||"").trim().toLowerCase()}|${String(x.date||"")}`;
    const affected=items.filter(x=>String(x.batchId||legacyGroupKey(x))===String(key));
    if(!affected.length){closeOutflowDelete();return;}
    const meds=getMedicines();
    affected.forEach(x=>{const m=meds.find(v=>v.name===x.medicine);if(m)m.stock=Number(m.stock||0)+Number(x.quantity||0);});
    saveMedicines(meds);
    const remaining=items.filter(x=>String(x.batchId||legacyGroupKey(x))!==String(key));
    saveOutflows(remaining);
    renderMedicineDirectory();renderOutflowDirectory();if(typeof renderMonthlyRecords==="function")renderMonthlyRecords();updateDashboardData();closeOutflowDelete();showNotification("Outflow deleted","The complete hospital distribution was deleted and all supplied quantities were returned to stock.");
}
function openEditOutflow(i){const x=getOutflows()[i];if(!x)return;editingOutflowIndex=i;editOutflowMedicineCategory="ALL";document.querySelectorAll("#editOutflowModal .outflow-category-chip").forEach(b=>b.classList.toggle("active",b.dataset.category==="ALL"));const ms=document.getElementById("editOutflowMedicine");ms.innerHTML='<option value="">Select medicine</option>'+getMedicines().map(m=>`<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)} — ${escapeHtml(m.type)} — Stock ${escapeHtml(m.stock)}</option>`).join("");ms.value=x.medicine;document.getElementById("editOutflowMedicineSearch").value=x.medicine;document.getElementById("editOutflowQuantity").value=x.quantity;document.getElementById("editOutflowDate").value=x.date;document.getElementById("editOutflowPrice").value=x.price;editOutflowFree=!!x.free;document.getElementById("editOutflowFreeButton").classList.toggle("selected",editOutflowFree);document.getElementById("editOutflowPrice").disabled=editOutflowFree;document.getElementById("editOutflowHospitalType").value=x.hospitalType;populateEditOutflowHospitals();document.getElementById("editOutflowHospital").value=x.hospital;document.getElementById("editOutflowModal").classList.add("open");renderEditOutflowMedicineOptions();}
function closeEditOutflow(e){if(e&&e.target!==e.currentTarget)return;document.getElementById("editOutflowModal")?.classList.remove("open");editingOutflowIndex=-1;}
function populateEditOutflowHospitals(){const type=document.getElementById("editOutflowHospitalType").value,sel=document.getElementById("editOutflowHospital"),current=sel.value;sel.innerHTML='<option value="">Select hospital</option>'+getHospitals().filter(h=>!type||h.type===type).map(h=>`<option value="${escapeHtml(h.name)}">${escapeHtml(h.name)}</option>`).join("");if(current)sel.value=current;}
function toggleEditOutflowFree(){editOutflowFree=!editOutflowFree;document.getElementById("editOutflowFreeButton").classList.toggle("selected",editOutflowFree);document.getElementById("editOutflowPrice").disabled=editOutflowFree;if(editOutflowFree)document.getElementById("editOutflowPrice").value=0;}
function saveEditedOutflow(){
    if(editingOutflowIndex<0)return;
    const items=getOutflows(),old=items[editingOutflowIndex];if(!old)return;
    const name=document.getElementById("editOutflowMedicine").value,qty=Number(document.getElementById("editOutflowQuantity").value),date=document.getElementById("editOutflowDate").value,price=editOutflowFree?0:Number(document.getElementById("editOutflowPrice").value||0),hospitalType=document.getElementById("editOutflowHospitalType").value,hospital=document.getElementById("editOutflowHospital").value,meds=getMedicines(),newMed=meds.find(m=>m.name===name);
    if(!newMed||!qty||!date||!hospitalType||!hospital||(!editOutflowFree&&document.getElementById("editOutflowPrice").value==="")){showNotification("Missing information","Complete all edit fields before saving.");return;}
    const oldMed=meds.find(m=>m.name===old.medicine);if(oldMed)oldMed.stock=Number(oldMed.stock)+Number(old.quantity);
    if(Number(newMed.stock)<qty){if(oldMed)oldMed.stock=Number(oldMed.stock)-Number(old.quantity);showNotification("Insufficient stock","There is not enough stock for the new quantity.");return;}
    newMed.stock=Number(newMed.stock)-qty;items[editingOutflowIndex]={...old,medicine:newMed.name,type:newMed.type,quantity:qty,date,price,free:editOutflowFree,hospitalType,hospital};saveMedicines(meds);saveOutflows(items);renderMedicineDirectory();renderOutflowDirectory();if(typeof renderMonthlyRecords==="function")renderMonthlyRecords();updateDashboardData();closeEditOutflow();showNotification("Outflow updated","The distribution record and stock were updated.");
}

// Shared month/date helpers used by both the outflow directory and monthly reports.
// These were missing in the previous build, causing directory rendering to stop
// immediately after a distribution was saved.
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function getMonthlyDateParts(value){
    const match = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return {year:"", month:"", day:""};
    return {year:match[1], month:String(Number(match[2])), day:String(Number(match[3]))};
}

function populateOutflowDirectoryFilters(){
    const groups=getOutflowGroups();
    const hospital=document.getElementById("outflowDirectoryHospital"), month=document.getElementById("outflowDirectoryMonth"), year=document.getElementById("outflowDirectoryYear");
    const type=document.getElementById("outflowDirectoryType")?.value||"ALL";
    if(hospital){const old=hospital.value||"ALL";const names=[...new Set(groups.filter(g=>type==="ALL"||(g.items[0]?.hospitalType===type)).map(g=>g.items[0]?.hospital).filter(Boolean))].sort((a,b)=>a.localeCompare(b));hospital.innerHTML='<option value="ALL">All Hospitals</option>'+names.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");hospital.value=names.includes(old)?old:"ALL";}
    const parts=groups.map(g=>getMonthlyDateParts(g.items[0]?.date));
    if(month){const old=month.value||"ALL";month.innerHTML='<option value="ALL">All Months</option>'+MONTH_NAMES.map((n,i)=>`<option value="${i+1}">${n}</option>`).join("");month.value=old;}
    if(year){const old=year.value||"ALL";const years=[...new Set(parts.map(x=>x.year).filter(Boolean))].sort((a,b)=>Number(b)-Number(a));year.innerHTML='<option value="ALL">All Years</option>'+years.map(y=>`<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`).join("");year.value=years.includes(old)?old:"ALL";}
}
function resetOutflowDirectoryFilters(){["outflowDirectorySearch","outflowDirectoryType","outflowDirectoryHospital","outflowDirectoryMonth","outflowDirectoryYear"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=id==="outflowDirectorySearch"?"":"ALL";});populateOutflowDirectoryFilters();renderOutflowDirectory();}
["outflowDirectorySearch","outflowDirectoryType","outflowDirectoryHospital","outflowDirectoryMonth","outflowDirectoryYear"].forEach(id=>document.getElementById(id)?.addEventListener(id==="outflowDirectorySearch"?"input":"change",()=>{if(id==="outflowDirectoryType")populateOutflowDirectoryFilters();renderOutflowDirectory();}));
function renderOutflowDirectory(){
    const list=document.getElementById("outflowDirectoryList");if(!list)return;
    populateOutflowDirectoryFilters();
    const allGroups=getOutflowGroups();
    const search=(document.getElementById("outflowDirectorySearch")?.value||"").trim().toLowerCase();
    const type=document.getElementById("outflowDirectoryType")?.value||"ALL", hospital=document.getElementById("outflowDirectoryHospital")?.value||"ALL", month=document.getElementById("outflowDirectoryMonth")?.value||"ALL", year=document.getElementById("outflowDirectoryYear")?.value||"ALL";
    const groups=allGroups.filter(g=>{const first=g.items[0]||{},parts=getMonthlyDateParts(first.date);const hay=[first.hospital,first.hospitalType,...g.items.map(x=>x.medicine)].join(" ").toLowerCase();return (!search||hay.includes(search))&&(type==="ALL"||first.hospitalType===type)&&(hospital==="ALL"||first.hospital===hospital)&&(month==="ALL"||parts.month===String(month))&&(year==="ALL"||parts.year===year);});
    const count=document.getElementById("outflowDirectoryCount");
    if(count)count.textContent=`${groups.length} Hospital Distribution${groups.length===1?"":"s"}`;
    if(!groups.length){list.innerHTML='<div class="medicine-empty-state"><span class="empty-state-icon"><svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM7 4h10v3H7zM8 11h8M8 15h5"/></svg></span><strong>No medicine outflow records</strong><small>Use Medicine Outflow to record a hospital distribution.</small></div>';return;}
    list.innerHTML=groups.map((g,i)=>{
        const first=g.items[0]||{}, units=outflowGroupUnits(g), total=outflowGroupTotal(g), single=g.items.length===1;
        const editButton=`<button class="directory-action edit-action" onclick="openEditOutflow(${g.items[0].__index})" title="Edit first medicine in this distribution" aria-label="Edit distribution"><svg viewBox="0 0 24 24"><path d="M4 20h5L20 9l-5-5L4 15v5zM13.5 5.5l5 5"/></svg></button>`;
        return `<div class="outflow-row outflow-group-row"><span>${i+1}</span><div class="outflow-group-hospital"><button type="button" class="outflow-hospital-link" onclick="openOutflowInfoByDirectoryIndex(${i})" title="View medicines supplied to this hospital"><strong>${escapeHtml(first.hospital||"—")}</strong><small>Click to view supplied medicines</small></button><small class="outflow-hospital-kind">${escapeHtml(first.hospitalType||"—")}</small></div><span>${escapeHtml(first.hospitalType||"—")}</span><span>${escapeHtml(formatSmartDate(first.date))}</span><strong>${g.items.length}</strong><strong>${units.toLocaleString()}</strong><span>${total>0?`Rs ${moneyValue(total)}`:"Free"}</span><div class="directory-actions"><button class="directory-action info-action" onclick="openOutflowInfo('${escapeHtml(String(g.key))}')" title="Info" aria-label="Info"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.2v.1"/></svg></button>${editButton}<button class="directory-action delete-action" onclick="openOutflowDelete('${escapeHtml(String(g.key))}')" title="Delete" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M8 7l1 13h6l1-13"/></svg></button><button class="directory-action report-action" onclick="downloadOutflowReportByBatch('${escapeHtml(String(g.batchId||g.key))}')" title="Download Word report" aria-label="Download Word report"><svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6zM14 3v4h4M9 12h6M9 16h4M12 15v4M9.5 17l2.5 2.5 2.5-2.5"/></svg></button></div></div>`;
    }).join("");
}
function formatReportDate(value){
    const d = new Date(String(value || "") + "T00:00:00");
    if (Number.isNaN(d.getTime())) return value || "—";
    return d.toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"numeric"});
}
function moneyValue(value){
    const n=Number(value||0);
    return n.toLocaleString("en-PK", {minimumFractionDigits:0, maximumFractionDigits:2});
}
function populateMonthlyFilterOptions(){
    const records=getOutflows();
    const years=[...new Set(records.map(x=>getMonthlyDateParts(x.date).year).filter(Boolean))].sort((a,b)=>Number(b)-Number(a));
    const medicines=[...new Set(records.map(x=>x.medicine).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const month=document.getElementById("monthlyMonth"), year=document.getElementById("monthlyYear"), medicine=document.getElementById("monthlyMedicine"), hospitalType=document.getElementById("monthlyHospitalType"), hospital=document.getElementById("monthlyHospital");
    if(month){ const old=month.value||"ALL"; month.innerHTML='<option value="ALL">All Months</option>'+MONTH_NAMES.map((n,i)=>`<option value="${i+1}">${n}</option>`).join(""); month.value=old; }
    if(year){ const old=year.value||"ALL"; year.innerHTML='<option value="ALL">All Years</option>'+years.map(y=>`<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`).join(""); year.value=years.includes(old)?old:"ALL"; }
    if(medicine){ const old=medicine.value||"ALL"; medicine.innerHTML='<option value="ALL">All Medicines</option>'+medicines.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join(""); medicine.value=medicines.includes(old)?old:"ALL"; }
    if(hospitalType && !hospitalType.value) hospitalType.value="ALL";
    populateMonthlyHospitals();
}
function populateMonthlyHospitals(){
    const type=document.getElementById("monthlyHospitalType")?.value||"ALL", select=document.getElementById("monthlyHospital");
    if(!select)return;
    const records=getOutflows().filter(x=>type==="ALL" || x.hospitalType===type);
    const names=[...new Set(records.map(x=>x.hospital).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const old=select.value||"ALL";
    select.innerHTML='<option value="ALL">All Hospitals</option>'+names.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
    select.value=names.includes(old)?old:"ALL";
}
function getFilteredMonthlyRecords(){
    const search=(document.getElementById("monthlySearch")?.value||"").trim().toLowerCase();
    const period=document.getElementById("monthlyPeriod")?.value||"ALL";
    const month=document.getElementById("monthlyMonth")?.value||"ALL", year=document.getElementById("monthlyYear")?.value||"ALL", medicine=document.getElementById("monthlyMedicine")?.value||"ALL", category=document.getElementById("monthlyCategory")?.value||"ALL", type=document.getElementById("monthlyHospitalType")?.value||"ALL", hospital=document.getElementById("monthlyHospital")?.value||"ALL", pricing=document.getElementById("monthlyPricing")?.value||"ALL";
    const today=new Date();today.setHours(0,0,0,0);const weekStart=new Date(today);weekStart.setDate(weekStart.getDate()-6);
    return getOutflows().filter(x=>{
        const parts=getMonthlyDateParts(x.date), recordDate=new Date(String(x.date||"")+"T00:00:00");
        const hay=[x.medicine,x.hospital,x.type,x.hospitalType,x.date,x.free?"free":"paid"].join(" ").toLowerCase();
        const periodMatch=period==="ALL" || (period==="DAILY" && recordDate.getTime()===today.getTime()) || (period==="WEEKLY" && !Number.isNaN(recordDate.getTime()) && recordDate>=weekStart && recordDate<=today) || (period==="MONTHLY" && (month==="ALL" || parts.month===String(month)) && (year==="ALL" || parts.year===year));
        return periodMatch && (!search || hay.includes(search)) && (month==="ALL" || parts.month===String(month)) && (year==="ALL" || parts.year===year) && (medicine==="ALL" || x.medicine===medicine) && (category==="ALL" || x.type===category) && (type==="ALL" || x.hospitalType===type) && (hospital==="ALL" || x.hospital===hospital) && (pricing==="ALL" || (pricing==="FREE" ? !!x.free : !x.free));
    }).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
function renderMonthlyRecords(){
    populateMonthlyFilterOptions();
    const records=getFilteredMonthlyRecords();
    monthlyFilteredRecords=records;
    const list=document.getElementById("monthlyRecordsList");
    if(!list)return;
    const totalUnits=records.reduce((s,x)=>s+Number(x.quantity||0),0);
    const freeUnits=records.filter(x=>x.free).reduce((s,x)=>s+Number(x.quantity||0),0);
    const paidValue=records.filter(x=>!x.free).reduce((s,x)=>s+(Number(x.quantity||0)*Number(x.price||0)),0);
    const hospitals=new Set(records.map(x=>x.hospital).filter(Boolean));
    const uniqueMeds=new Set(records.map(x=>x.medicine).filter(Boolean));
    const ids={records:"monthlyTotalRecords",units:"monthlyTotalUnits",hospitals:"monthlyHospitalCount",paid:"monthlyPaidValue",free:"monthlyFreeUnits"};
    document.getElementById(ids.records).textContent=records.length.toLocaleString();
    document.getElementById(ids.units).textContent=totalUnits.toLocaleString();
    document.getElementById(ids.hospitals).textContent=hospitals.size.toLocaleString();
    document.getElementById(ids.paid).textContent=paidValue ? `Rs ${moneyValue(paidValue)}` : "Rs 0";
    document.getElementById(ids.free).textContent=freeUnits.toLocaleString();
    const count=document.getElementById("monthlyResultCount"), label=document.getElementById("monthlyResultLabel"), footer=document.getElementById("monthlyFooterText"), footerTotal=document.getElementById("monthlyFooterTotal");
    if(count)count.textContent=`${records.length} record${records.length===1?"":"s"}`;
    if(label)label.textContent=`${records.length} distribution${records.length===1?"":"s"} • ${uniqueMeds.size} medicine${uniqueMeds.size===1?"":"s"} • ${hospitals.size} hospital${hospitals.size===1?"":"s"}`;
    if(footer)footer.textContent=records.length?"Showing the records that match your selected filters.":"No records match the selected filters.";
    if(footerTotal)footerTotal.textContent=`Total supplied: ${totalUnits.toLocaleString()} units`;
    if(!records.length){ list.innerHTML='<div class="monthly-empty-state"><span><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg></span><strong>No supply records found</strong><small>Complete a Medicine Outflow entry or change the filters to view records here.</small></div>'; return; }
    list.innerHTML=records.map((x,i)=>{
        const total=Number(x.quantity||0)*Number(x.price||0);
        return `<div class="monthly-record-row">\n            <span class="monthly-sno">${i+1}</span>\n            <span class="monthly-date">${escapeHtml(formatSmartDate(x.date))}</span>\n            <div class="monthly-medicine"><strong>${escapeHtml(x.medicine)}</strong><small>${escapeHtml(x.hospital||"—")}</small></div>\n            <span class="monthly-category">${escapeHtml(x.type||"OTHER")}</span>\n            <strong class="monthly-qty">${Number(x.quantity||0).toLocaleString()}</strong>\n            <div class="monthly-hospital"><strong>${escapeHtml(x.hospital||"—")}</strong><small>${escapeHtml(x.hospitalType||"—")}</small></div>\n            <span class="monthly-hospital-type">${escapeHtml(x.hospitalType||"—")}</span>\n            <span class="monthly-pricing ${x.free?"free":"paid"}">${x.free?"FREE":"PAID"}</span>\n            <span class="monthly-price">${x.free?"—":`Rs ${moneyValue(x.price)}`}</span>\n            <span class="monthly-total">${x.free?"Free":`Rs ${moneyValue(total)}`}</span>\n            <button type="button" class="monthly-info-btn" onclick="openMonthlyRecordInfo('${escapeHtml(String(x.id))}')" title="See complete medicine information" aria-label="See complete medicine information"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.2v.1"/></svg><span>See Info</span></button>\n        </div>`;
    }).join("");
}
function resetMonthlyFilters(){
    ["monthlySearch","monthlyPeriod","monthlyMonth","monthlyYear","monthlyMedicine","monthlyCategory","monthlyHospitalType","monthlyHospital","monthlyPricing"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=id==="monthlySearch"?"":"ALL";});
    populateMonthlyFilterOptions(); renderMonthlyRecords();
}
function openMonthlyRecordInfo(id){
    const record=getOutflows().find(x=>String(x.id)===String(id));
    if(!record)return;
    const medicine=getMedicines().find(m=>m.name===record.medicine);
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value==null||value===""?"—":value;};
    const total=Number(record.quantity||0)*Number(record.price||0);
    set("monthlyInfoMedicine",record.medicine);
    set("monthlyInfoCategory",record.type||medicine?.type||"OTHER");
    set("monthlyInfoExpiry",medicine?.expiry?formatMedicineExpiry(medicine.expiry):"Not available");
    set("monthlyInfoStock",medicine?Number(medicine.stock||0).toLocaleString():"Not available");
    set("monthlyInfoQuantity",Number(record.quantity||0).toLocaleString()+" units");
    set("monthlyInfoDate",formatSmartDate(record.date));
    set("monthlyInfoHospital",record.hospital);
    set("monthlyInfoHospitalType",record.hospitalType);
    set("monthlyInfoPricing",record.free?"FREE":"PAID");
    set("monthlyInfoUnitPrice",record.free?"Free":"Rs "+moneyValue(record.price));
    set("monthlyInfoTotal",record.free?"Free":"Rs "+moneyValue(total));
    document.getElementById("monthlyRecordInfoModal")?.classList.add("open");
}
function closeMonthlyRecordInfo(e){
    if(e&&e.target!==e.currentTarget)return;
    document.getElementById("monthlyRecordInfoModal")?.classList.remove("open");
}
function exportMonthlyRecords(){
    const records=monthlyFilteredRecords||getFilteredMonthlyRecords();
    if(!records.length){showNotification("Nothing to export","There are no monthly records matching the current filters.");return;}
    const headers=["S.No","Date","Medicine","Category","Quantity","Hospital","Hospital Type","Pricing","Unit Price","Total Value"];
    const rows=records.map((x,i)=>[i+1,x.date,x.medicine,x.type,x.quantity,x.hospital,x.hospitalType,x.free?"Free":"Paid",x.free?0:x.price,x.free?0:Number(x.quantity||0)*Number(x.price||0)]);
    const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url; a.download=`Medicine-Supply-Report-${todayISO()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showNotification("Report exported","The filtered monthly supply report was exported as a CSV file.");
}
function printMonthlyRecords(){
    const records=monthlyFilteredRecords||getFilteredMonthlyRecords();
    if(!records.length){showNotification("Nothing to print","There are no monthly records matching the current filters.");return;}
    const totalUnits=records.reduce((s,x)=>s+Number(x.quantity||0),0), paidValue=records.filter(x=>!x.free).reduce((s,x)=>s+Number(x.quantity||0)*Number(x.price||0),0), freeUnits=records.filter(x=>x.free).reduce((s,x)=>s+Number(x.quantity||0),0);
    const rows=records.map((x,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(formatReportDate(x.date))}</td><td>${escapeHtml(x.medicine)}</td><td>${escapeHtml(x.type)}</td><td>${Number(x.quantity||0)}</td><td>${escapeHtml(x.hospital)}</td><td>${escapeHtml(x.hospitalType)}</td><td>${x.free?"FREE":"PAID"}</td><td>${x.free?"—":"Rs "+moneyValue(x.price)}</td><td>${x.free?"Free":"Rs "+moneyValue(Number(x.quantity||0)*Number(x.price||0))}</td></tr>`).join("");
    const win=window.open("","_blank","width=1200,height=800");
    if(!win){showNotification("Print blocked","Allow pop-ups for this page and try again.");return;}
    win.document.write(`<!doctype html><html><head><title>Medicine Supply Report</title><style>body{font-family:Arial,sans-serif;margin:28px;color:#14263a}h1{margin:0 0 5px;font-size:22px}p{color:#60758b;margin:0 0 18px;font-size:12px}.stats{display:flex;gap:10px;margin-bottom:18px}.stat{border:1px solid #d7e1ea;border-radius:10px;padding:10px 14px;min-width:130px}.stat b{display:block;font-size:16px;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d9e2ea;padding:7px;text-align:left}th{background:#eef4f9;text-transform:uppercase;font-size:9px}@media print{body{margin:12mm}}</style></head><body><h1>Medicine Supply Report</h1><p>District Quetta Medicine Store • Generated ${escapeHtml(formatReportDate(todayISO()))}</p><div class="stats"><div class="stat">Records<b>${records.length}</b></div><div class="stat">Units<b>${totalUnits}</b></div><div class="stat">Free Units<b>${freeUnits}</b></div><div class="stat">Paid Value<b>Rs ${moneyValue(paidValue)}</b></div></div><table><thead><tr><th>S.No</th><th>Date</th><th>Medicine</th><th>Category</th><th>Qty</th><th>Hospital</th><th>Type</th><th>Pricing</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    win.document.close(); win.focus(); setTimeout(()=>win.print(),250);
}

function initMonthlyRecords(){
    ["monthlySearch","monthlyPeriod","monthlyMonth","monthlyYear","monthlyMedicine","monthlyCategory","monthlyHospitalType","monthlyHospital","monthlyPricing"].forEach(id=>{
        const el=document.getElementById(id); if(!el)return;
        el.addEventListener("input",()=>renderMonthlyRecords());
        el.addEventListener("change",()=>{if(id==="monthlyHospitalType")populateMonthlyHospitals();renderMonthlyRecords();});
    });
    renderMonthlyRecords();
}
initMonthlyRecords();


/* =========================================================
   PROFESSIONAL CUSTOM DROPDOWNS — ALL SYSTEM SELECTS
   Native selects remain as the data source, while every visible
   dropdown uses the same lightweight custom glass menu.
========================================================= */
(function initProfessionalDropdowns(){
    let activeShell=null;
    let activeSelect=null;
    let menu=null;

    function ensureMenu(){
        if(menu)return menu;
        menu=document.createElement("div");
        menu.className="custom-dropdown-menu";
        menu.hidden=true;
        document.body.appendChild(menu);
        return menu;
    }
    function closeMenu(){
        if(activeShell)activeShell.classList.remove("open");
        if(menu){menu.hidden=true;menu.innerHTML="";}
        activeShell=null;activeSelect=null;
    }
    function escapeText(value){
        const span=document.createElement("span");
        span.textContent=value==null?"":String(value);
        return span.innerHTML;
    }
    function syncTrigger(select,shell){
        const trigger=shell?.querySelector(".custom-select-trigger");
        const valueEl=trigger?.querySelector(".custom-select-value");
        if(!trigger||!valueEl)return;
        const option=Array.from(select.options).find(o=>o.value===select.value)||select.options[0];
        const text=option?option.textContent.trim():"Select option";
        valueEl.textContent=text||"Select option";
        const placeholder=!select.value;
        trigger.classList.toggle("placeholder",placeholder);
        trigger.setAttribute("aria-label",text||"Select option");
    }
    function positionMenu(shell){
        const m=ensureMenu(),rect=shell.getBoundingClientRect(),gap=6,pad=10;
        const maxH=Math.min(245,Math.max(130,window.innerHeight-pad*2));
        m.style.maxHeight=maxH+"px";
        m.style.width=Math.max(rect.width,150)+"px";
        m.style.left=Math.max(pad,Math.min(rect.left,window.innerWidth-rect.width-pad))+"px";
        const measured=m.getBoundingClientRect();
        let top=rect.bottom+gap;
        if(top+measured.height>window.innerHeight-pad&&rect.top-measured.height-gap>=pad)top=rect.top-measured.height-gap;
        m.style.top=Math.max(pad,top)+"px";
    }
    function openMenu(select,shell){
        if(activeSelect===select&&!ensureMenu().hidden){closeMenu();return;}
        closeMenu();activeSelect=select;activeShell=shell;shell.classList.add("open");
        const m=ensureMenu();m.innerHTML="";
        Array.from(select.options).forEach((option,index)=>{
            const item=document.createElement("button");
            item.type="button";item.className="custom-dropdown-option"+(option.value===select.value?" selected":"");
            item.dataset.value=option.value;
            item.innerHTML=`<span>${escapeText(option.textContent.trim())}</span><span class="option-check">✓</span>`;
            item.addEventListener("click",()=>{select.value=option.value;select.dispatchEvent(new Event("change",{bubbles:true}));syncTrigger(select,shell);closeMenu();});
            item.addEventListener("keydown",e=>{
                const options=m.querySelectorAll(".custom-dropdown-option");
                if(e.key==="Escape"){e.preventDefault();closeMenu();shell.querySelector(".custom-select-trigger")?.focus();}
                if(e.key==="ArrowDown"){e.preventDefault();options[Math.min(index+1,options.length-1)]?.focus();}
                if(e.key==="ArrowUp"){e.preventDefault();options[Math.max(index-1,0)]?.focus();}
            });
            m.appendChild(item);
        });
        m.hidden=false;positionMenu(shell);
        (m.querySelector(".custom-dropdown-option.selected")||m.querySelector(".custom-dropdown-option"))?.focus();
    }
    function enhance(select){
        if(!select||select.dataset.customDropdownReady==="1"||select.classList.contains("search-only-select"))return;
        select.dataset.customDropdownReady="1";
        const shell=document.createElement("div");shell.className="custom-select-shell";
        select.parentNode.insertBefore(shell,select);shell.appendChild(select);
        select.classList.add("native-select-source");
        const trigger=document.createElement("button");trigger.type="button";trigger.className="custom-select-trigger";
        trigger.innerHTML='<span class="custom-select-value">Select option</span>';
        trigger.addEventListener("click",()=>{syncTrigger(select,shell);openMenu(select,shell);});
        trigger.addEventListener("keydown",e=>{if(e.key==="ArrowDown"||e.key==="Enter"||e.key===" "){e.preventDefault();openMenu(select,shell);}});
        shell.insertBefore(trigger,select);
        select.addEventListener("change",()=>syncTrigger(select,shell));
        const optionObserver=new MutationObserver(()=>syncTrigger(select,shell));
        optionObserver.observe(select,{childList:true});
        syncTrigger(select,shell);
    }
    function enhanceAll(){document.querySelectorAll("select:not(.search-only-select)").forEach(enhance);}
    function closeIfOutside(e){if(!activeShell)return;if(activeShell.contains(e.target)||menu?.contains(e.target))return;closeMenu();}

    document.addEventListener("click",closeIfOutside,true);
    document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu();});
    window.addEventListener("resize",()=>{if(activeShell&&menu&&!menu.hidden)positionMenu(activeShell);});
    window.addEventListener("scroll",()=>{if(activeShell&&menu&&!menu.hidden)positionMenu(activeShell);},true);

    function syncAllTriggers(){
        document.querySelectorAll("select.native-select-source").forEach(select=>{
            const shell=select.closest(".custom-select-shell");
            if(shell)syncTrigger(select,shell);
        });
    }
    function boot(){
        enhanceAll();
        // Keep dropdown styling consistent for filters inserted by mini-tabs or
        // refreshed sections, not only the selects present on initial load.
        const observer=new MutationObserver(records=>{
            let needsEnhance=false;
            records.forEach(record=>record.addedNodes.forEach(node=>{
                if(node.nodeType!==1)return;
                if(node.matches?.("select:not(.search-only-select)"))needsEnhance=true;
                if(node.querySelector?.("select:not(.search-only-select)"))needsEnhance=true;
            }));
            if(needsEnhance)enhanceAll();
        });
        observer.observe(document.body,{childList:true,subtree:true});
        // Programmatic filter resets also update the visible custom trigger.
        window.setInterval(syncAllTriggers,400);
    }
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();

if (typeof updateDashboardData === "function") updateDashboardData();
// Render persisted outflow data on startup as well as after a new distribution.
(function initializeOutflowViews(){
    const run=()=>{
        try { if(typeof renderOutflowDirectory === "function") renderOutflowDirectory(); } catch(error) { console.error("Initial outflow directory render failed:", error); }
        try { if(typeof renderMonthlyRecords === "function") renderMonthlyRecords(); } catch(error) { console.error("Initial monthly report render failed:", error); }
    };
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, {once:true});
    else run();
})();
