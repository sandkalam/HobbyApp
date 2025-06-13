document.addEventListener("DOMContentLoaded", () => {
  // --- State Aplikasi ---
  let names = [];
  let generatedGroups = [];
  let affinityPairs = [];
  let exclusionPairs = [];
  let lastSettings = {};
  const creativeNamesPool = [
    "Tim Elang",
    "Grup Kobra",
    "Skuad Singa",
    "Regu Phoenix",
    "Tim Andromeda",
    "Grup Orion",
    "Skuad Pegasus",
    "Regu Cygnus",
  ];

  // --- Elemen DOM ---
  const themeToggle = document.getElementById("themeToggle");
  const advancedModeToggle = document.getElementById("advancedModeToggle");
  const advancedFeaturesDiv = document.getElementById("advancedFeatures");
  const listManagerSelect = document.getElementById("listManagerSelect");
  const loadListBtn = document.getElementById("loadListBtn");
  const saveListBtn = document.getElementById("saveListBtn");
  const deleteListBtn = document.getElementById("deleteListBtn");
  const nameInput = document.getElementById("nameInput");
  const tagsContainer = document.getElementById("tagsContainer");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const generateBtn = document.getElementById("generateBtn");
  const resultsDiv = document.getElementById("results");
  const resultsActions = document.getElementById("resultsActions");
  const reshuffleBtn = document.getElementById("reshuffleBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const copyTxtBtn = document.getElementById("copyTxtBtn");
  const copyJsonBtn = document.getElementById("copyJsonBtn");
  const groupCountInput = document.getElementById("groupCount");
  const peoplePerGroupInput = document.getElementById("peoplePerGroup");
  const ruleName1 = document.getElementById("ruleName1");
  const ruleName2 = document.getElementById("ruleName2");
  const addAffinityBtn = document.getElementById("addAffinityBtn");
  const addExclusionBtn = document.getElementById("addExclusionBtn");
  const affinityRulesList = document.getElementById("affinityRulesList");
  const exclusionRulesList = document.getElementById("exclusionRulesList");
  const creativeNamesToggle = document.getElementById("creativeNamesToggle");
  const totalCountLabel = document.getElementById("totalCountLabel"); // TAMBAHAN

  // --- === Logika Inti Penanganan Nama (Stabil) === ---

  function addName(name) {
    const trimmedName = name.trim();
    if (trimmedName && !names.includes(trimmedName)) {
      names.push(trimmedName);
      createTagElement(trimmedName);
      updateAndSave();
    }
  }

  function removeName(nameToRemove) {
    names = names.filter((n) => n !== nameToRemove);
    const tagToRemove = tagsContainer.querySelector(
      `.tag[data-name="${nameToRemove}"]`,
    );
    if (tagToRemove) tagsContainer.removeChild(tagToRemove);
    updateAndSave();
  }

  function editName(oldName, newName) {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName || trimmedNewName === oldName) return;
    if (names.includes(trimmedNewName)) {
      alert(`Nama "${trimmedNewName}" sudah ada.`);
      return;
    }

    const index = names.indexOf(oldName);
    if (index > -1) {
      names[index] = trimmedNewName;
      const tagToEdit = tagsContainer.querySelector(
        `.tag[data-name="${oldName}"]`,
      );
      if (tagToEdit) {
        tagToEdit.querySelector("span").textContent = trimmedNewName;
        tagToEdit.dataset.name = trimmedNewName;
      }
      updateAndSave();
    }
  }

  function createTagElement(name) {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.dataset.name = name;

    const nameSpan = document.createElement("span");
    nameSpan.textContent = name;
    tag.appendChild(nameSpan);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = "&times;";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeName(tag.dataset.name);
    });
    tag.appendChild(removeBtn);

    tag.addEventListener("dblclick", () => {
      const currentName = tag.dataset.name;
      nameSpan.innerHTML = "";
      const input = document.createElement("input");
      input.type = "text";
      input.className = "inline-edit-input";
      input.value = currentName;

      nameSpan.appendChild(input);
      input.focus();

      const saveChanges = () => {
        const newNameValue = input.value;
        editName(currentName, newNameValue);
        nameSpan.innerHTML = "";
        nameSpan.textContent = names.includes(newNameValue.trim())
          ? newNameValue.trim()
          : currentName;
      };

      input.addEventListener("blur", saveChanges);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
        else if (e.key === "Escape") {
          input.value = currentName;
          input.blur();
        }
      });
    });

    tagsContainer.insertBefore(tag, nameInput);
  }

  function updateAndSave() {
    updateRuleDropdowns();
    saveNamesToStorage();
    updateTotalCountDisplay(); // TAMBAHAN: Panggil update penghitung
  }

  // TAMBAHAN: Fungsi untuk update penghitung jumlah orang
  function updateTotalCountDisplay() {
    totalCountLabel.textContent = `(${names.length} orang)`;
  }

  // --- === Pengendali Event Input Utama === ---

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addName(nameInput.value);
      nameInput.value = "";
    }
  });

  nameInput.addEventListener("paste", (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData(
      "text",
    );
    const newNames = pastedText.split(/[\n,]+/);
    newNames.forEach((name) => addName(name));
  });

  tagsContainer.addEventListener("click", () => nameInput.focus());

  // --- === Fitur & Logika Aplikasi Lainnya === ---

  function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.classList.toggle("dark-mode", savedTheme === "dark");
    themeToggle.checked = savedTheme === "dark";
  }

  function getAllLists() {
    return JSON.parse(localStorage.getItem("groupGeneratorAllLists")) || {};
  }
  function saveAllLists(lists) {
    localStorage.setItem("groupGeneratorAllLists", JSON.stringify(lists));
  }
  function loadAllLists() {
    const lists = getAllLists();
    listManagerSelect.innerHTML = "";
    if (Object.keys(lists).length === 0) {
      listManagerSelect.add(new Option("Belum ada daftar", ""));
      return;
    }
    for (const listName in lists)
      listManagerSelect.add(new Option(listName, listName));
  }

  function clearAll(confirmFirst = true) {
    const doClear = () => {
      names = [];
      affinityPairs = [];
      exclusionPairs = [];
      tagsContainer.querySelectorAll(".tag").forEach((e) => e.remove());
      resultsDiv.innerHTML = "";
      resultsActions.style.display = "none";
      updateAndSave();
    };
    if (
      !confirmFirst ||
      confirm("Yakin ingin menghapus semua nama dari daftar aktif?")
    ) {
      doClear();
    }
  }

  function saveNamesToStorage() {
    localStorage.setItem("groupGeneratorActiveList", JSON.stringify(names));
  }
  function loadNamesFromStorage() {
    const saved = localStorage.getItem("groupGeneratorActiveList");
    if (saved) {
      const loadedNames = JSON.parse(saved);
      clearAll(false);
      loadedNames.forEach(addName);
    }
    updateTotalCountDisplay(); // Panggil saat memuat juga
  }

  // --- Logika Aturan (Rules Engine) ---
  function updateRuleDropdowns() {
    (ruleName1.innerHTML = ""), (ruleName2.innerHTML = "");
    const e = new Option("Pilih nama 1", ""),
      t = new Option("Pilih nama 2", "");
    ruleName1.add(e),
      ruleName2.add(t),
      names.forEach((e) => {
        ruleName1.add(new Option(e, e)), ruleName2.add(new Option(e, e));
      });
  }
  function renderRules() {
    (affinityRulesList.innerHTML = ""),
      (exclusionRulesList.innerHTML = ""),
      affinityPairs.forEach((e, t) => {
        const n = document.createElement("li");
        (n.innerHTML = `<span class="tag-affinity">✔ ${e[0]} & ${e[1]}</span> <button class="remove-rule-btn" data-type="affinity" data-index="${t}">&times;</button>`),
          affinityRulesList.appendChild(n);
      }),
      exclusionPairs.forEach((e, t) => {
        const n = document.createElement("li");
        (n.innerHTML = `<span class="tag-exclusion">✖ ${e[0]} & ${e[1]}</span> <button class="remove-rule-btn" data-type="exclusion" data-index="${t}">&times;</button>`),
          exclusionRulesList.appendChild(n);
      });
  }
  function addRule(e) {
    const t = ruleName1.value,
      n = ruleName2.value;
    if (!t || !n) return void alert("Silakan pilih dua nama.");
    if (t === n) return void alert("Silakan pilih dua nama yang berbeda.");
    const r = [t, n].sort();
    let o = !1;
    "affinity" === e
      ? (affinityPairs.forEach((e) => {
          e.join() === r.join() && (o = !0);
        }),
        o || affinityPairs.push(r))
      : (exclusionPairs.forEach((e) => {
          e.join() === r.join() && (o = !0);
        }),
        o || exclusionPairs.push(r)),
      o ? alert("Aturan tersebut sudah ada.") : renderRules();
  }

  // --- Logika Inti Pembagian Kelompok ---
  function generateGroups() {
    if (names.length === 0) {
      alert("Silakan masukan nama terlebih dahulu.");
      return false;
    }
    const groupCount = parseInt(groupCountInput.value);
    const peoplePerGroup = parseInt(peoplePerGroupInput.value);
    if (!groupCount && !peoplePerGroup) {
      alert("Tentukan jumlah kelompok atau orang per kelompok.");
      return false;
    }

    lastSettings = {
      groupCount,
      peoplePerGroup,
      leftoverRule: document.querySelector('input[name="leftover"]:checked')
        .value,
      creativeNames: creativeNamesToggle.checked,
      isAdvanced: advancedModeToggle.checked,
    };

    let unitsToShuffle;
    if (lastSettings.isAdvanced) {
      let tempNames = [...names];
      const affinityGroups = affinityPairs.map((p) => new Set(p));
      tempNames = tempNames.filter(
        (name) => !affinityPairs.flat().includes(name),
      );
      unitsToShuffle = [...tempNames, ...affinityGroups];
    } else {
      unitsToShuffle = [...names];
    }

    for (let i = unitsToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unitsToShuffle[i], unitsToShuffle[j]] = [
        unitsToShuffle[j],
        unitsToShuffle[i],
      ];
    }

    let flatShuffledNames = unitsToShuffle.flatMap((unit) =>
      unit instanceof Set ? Array.from(unit) : unit,
    );
    generatedGroups = [];

    if (groupCount > 0) {
      if (groupCount > names.length) {
        alert("Jumlah kelompok tidak boleh lebih dari jumlah orang.");
        return false;
      }
      for (let i = 0; i < groupCount; i++) generatedGroups.push([]);
      let currentGroup = 0;
      while (flatShuffledNames.length > 0) {
        let name = flatShuffledNames.shift();
        let placed = false;
        if (lastSettings.isAdvanced) {
          for (let i = 0; i < groupCount; i++) {
            const targetGroup = (currentGroup + i) % groupCount;
            const hasExclusion = exclusionPairs.some(
              (p) =>
                p.includes(name) &&
                generatedGroups[targetGroup].some((m) => p.includes(m)),
            );
            if (!hasExclusion) {
              generatedGroups[targetGroup].push(name);
              placed = true;
              break;
            }
          }
        }
        if (!placed) {
          generatedGroups.sort((a, b) => a.length - b.length)[0].push(name);
        }
        currentGroup = (currentGroup + 1) % groupCount;
      }
    } else if (peoplePerGroup > 0) {
      if (peoplePerGroup > names.length) {
        alert("Jumlah orang per kelompok tidak boleh lebih dari jumlah total.");
        return false;
      }
      for (let i = 0; i < flatShuffledNames.length; i += peoplePerGroup) {
        generatedGroups.push(flatShuffledNames.slice(i, i + peoplePerGroup));
      }
      if (
        lastSettings.leftoverRule === "distribute" &&
        generatedGroups.length > 1
      ) {
        const lastGroup = generatedGroups[generatedGroups.length - 1];
        const totalValidGroups =
          generatedGroups.length - (lastGroup.length < peoplePerGroup ? 1 : 0);
        if (lastGroup.length < peoplePerGroup) {
          const leftovers = generatedGroups.pop();
          leftovers.forEach((leftover, index) => {
            generatedGroups[index % totalValidGroups].push(leftover);
          });
        }
      }
    }
    displayResults();
  }

  function displayResults() {
    resultsDiv.innerHTML = "";
    if (generatedGroups.length === 0) {
      resultsActions.style.display = "none";
      return;
    }

    let groupNamer = (index) => `Kelompok ${index + 1}`;
    if (lastSettings.creativeNames) {
      const shuffledCreativeNames = [...creativeNamesPool].sort(
        () => 0.5 - Math.random(),
      );
      groupNamer = (index) =>
        shuffledCreativeNames[index % shuffledCreativeNames.length];
    }

    generatedGroups.forEach((group, index) => {
      const groupCard = document.createElement("div");
      groupCard.className = "group-card";
      const title = document.createElement("h3");
      title.textContent = groupNamer(index);
      const memberList = document.createElement("ul");
      group.forEach((name) => {
        const listItem = document.createElement("li");
        listItem.textContent = name;
        memberList.appendChild(listItem);
      });
      groupCard.appendChild(title);
      groupCard.appendChild(memberList);
      resultsDiv.appendChild(groupCard);
    });
    resultsActions.style.display = "flex";
    reshuffleBtn.classList.toggle("hidden", !lastSettings.isAdvanced);
  }

  // --- === Pengendali Event Tombol & Toggle === ---
  themeToggle.addEventListener("change", (e) => {
    const theme = e.target.checked ? "dark" : "light";
    document.body.classList.toggle("dark-mode", e.target.checked);
    localStorage.setItem("theme", theme);
  });

  advancedModeToggle.addEventListener("change", (e) => {
    const isAdvanced = e.target.checked;
    if (
      !isAdvanced &&
      (affinityPairs.length > 0 || exclusionPairs.length > 0)
    ) {
      if (
        confirm("Beralih ke mode Basic akan menghapus semua aturan. Lanjutkan?")
      ) {
        affinityPairs = [];
        exclusionPairs = [];
        renderRules();
        advancedFeaturesDiv.classList.add("hidden");
      } else {
        e.target.checked = true;
      }
    } else {
      advancedFeaturesDiv.classList.toggle("hidden", !isAdvanced);
    }
  });

  saveListBtn.addEventListener("click", () => {
    const listName = prompt("Masukan nama untuk daftar ini:", "Daftar Baru");
    if (listName && names.length > 0) {
      const lists = getAllLists();
      lists[listName] = [...names];
      saveAllLists(lists);
      loadAllLists();
      listManagerSelect.value = listName;
      alert(`Daftar "${listName}" berhasil disimpan!`);
    } else if (names.length === 0) alert("Tidak ada nama untuk disimpan.");
  });

  loadListBtn.addEventListener("click", () => {
    const listName = listManagerSelect.value;
    if (listName) {
      const lists = getAllLists();
      if (lists[listName]) {
        clearAll(false);
        lists[listName].forEach(addName);
      }
    }
  });

  deleteListBtn.addEventListener("click", () => {
    const listName = listManagerSelect.value;
    if (listName && confirm(`Yakin ingin menghapus daftar "${listName}"?`)) {
      const lists = getAllLists();
      delete lists[listName];
      saveAllLists(lists);
      loadAllLists();
    }
  });

  clearAllBtn.addEventListener("click", () => clearAll(true));
  generateBtn.addEventListener("click", generateGroups);
  reshuffleBtn.addEventListener("click", generateGroups);

  // TAMBAHAN: Listener untuk input jumlah kelompok/orang
  groupCountInput.addEventListener("input", () => {
    if (groupCountInput.value) {
      peoplePerGroupInput.value = "";
      peoplePerGroupInput.classList.add("input-disabled-visual");
      groupCountInput.classList.remove("input-disabled-visual");
    } else {
      peoplePerGroupInput.classList.remove("input-disabled-visual");
    }
  });

  peoplePerGroupInput.addEventListener("input", () => {
    if (peoplePerGroupInput.value) {
      groupCountInput.value = "";
      groupCountInput.classList.add("input-disabled-visual");
      peoplePerGroupInput.classList.remove("input-disabled-visual");
    } else {
      groupCountInput.classList.remove("input-disabled-visual");
    }
  });

  addAffinityBtn.addEventListener("click", () => addRule("affinity"));
  addExclusionBtn.addEventListener("click", () => addRule("exclusion"));
  rulesEngine.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-rule-btn")) {
      const type = e.target.dataset.type;
      const index = e.target.dataset.index;
      if (type === "affinity") affinityPairs.splice(index, 1);
      else exclusionPairs.splice(index, 1);
      renderRules();
    }
  });

  exportCsvBtn.addEventListener("click", () => {
    if (generatedGroups.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Kelompok,Anggota\n";
    document.querySelectorAll(".group-card").forEach((card, index) => {
      const groupName = card.querySelector("h3").textContent.replace(",", ""); // prevent comma issue
      card.querySelectorAll("li").forEach((member, memberIndex) => {
        const row =
          memberIndex === 0
            ? `"${groupName}",${member.textContent}\n`
            : `"",${member.textContent}\n`;
        csvContent += row;
      });
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "hasil_kelompok.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  copyTxtBtn.addEventListener("click", () => {
    if (0 === generatedGroups.length) return;
    const e = generatedGroups
      .map((e, t) => {
        const n = e.map((e) => `- ${e}`).join("\n");
        return `${document.querySelectorAll(".group-card h3")[t].textContent}\n${n}`;
      })
      .join("\n\n");
    navigator.clipboard.writeText(e).then(() => {
      const e = copyTxtBtn.textContent;
      (copyTxtBtn.textContent = "✅ Teks Disalin!"),
        setTimeout(() => {
          copyTxtBtn.textContent = e;
        }, 2e3);
    });
  });
  copyJsonBtn.addEventListener("click", () => {
    if (0 === generatedGroups.length) return;
    const e = {};
    generatedGroups.forEach((t, n) => {
      const r = document.querySelectorAll(".group-card h3")[n].textContent;
      e[r] = t;
    });
    const t = JSON.stringify(e, null, 2);
    navigator.clipboard.writeText(t).then(() => {
      const e = copyJsonBtn.textContent;
      (copyJsonBtn.textContent = "✅ JSON Disalin!"),
        setTimeout(() => {
          copyJsonBtn.textContent = e;
        }, 2e3);
    });
  });

  // --- Inisialisasi Aplikasi ---
  initTheme();
  loadAllLists();
  loadNamesFromStorage();
});
