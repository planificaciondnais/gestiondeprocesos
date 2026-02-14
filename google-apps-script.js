const SHEET_NAME = "Hoja 1"; // Asegúrate de que tu pestaña se llame así
const HEADERS = [
    "ID",
    "Proceso",
    "Presupuesto",
    "Fecha Creación",
    "Informe Est. Mercado",
    "Inicio Proceso",
    "Días Inicio Proceso",
    "Cert Planificación",
    "Días Planificación",
    "Cert Compras",
    "Días Compras",
    "Cert Financiero",
    "Días Financiero",
    "Cert Delegado",
    "Días Delegado",
    "Cert Jurídico",
    "Días Jurídico",
    "Cert Adjudicado",
    "Días Adjudicada",
    "Monto Adjudicado"
];

function getOrCreateSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(HEADERS);
    }
    return sheet;
}

const DATE_FIELDS = [
    "memoArrivalDate",
    "marketStudyReportDate",
    "processStartDate",
    "planningCertDate",
    "delegateCertDate",
    "legalCertDate",
    "procurementCertDate",
    "awardedCertDate",
    "financialCertDate",
    "createdAt"
];

function formatDateForSheet(dateStr) {
    if (!dateStr) return "";
    // Si ya viene en formato DD/MM/YYYY, devolverlo tal cual
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateStr;

    // Si viene como ISO datetime (ej: 2026-02-13T09:21:05.123Z), extraer solo la fecha
    if (dateStr.indexOf('T') !== -1) {
        dateStr = dateStr.split('T')[0];
    }

    // Si viene en YYYY-MM-DD (del input type="date")
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

function formatDateForApp(val) {
    if (!val) return "";

    // Si es un objeto Date de Google Sheets
    if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Si es un string, intentar detectar el formato
    if (typeof val === 'string') {
        // DD/MM/YYYY
        if (val.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const parts = val.split('/');
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        // ISO String (YYYY-MM-DDTHH:mm...)
        if (val.match(/^\d{4}-\d{2}-\d{2}T/)) {
            return val.split('T')[0];
        }
    }

    return val;
}

function doGet() {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const jsonInfo = rows.map((row) => {
        let obj = {};
        headers.forEach((header, index) => {
            let key = "";
            switch (header) {
                case "ID": key = "id"; break;
                case "Proceso": key = "name"; break;
                case "Presupuesto": key = "budget"; break;
                case "Fecha Creación": key = "createdAt"; break;
                case "Informe Est. Mercado": key = "marketStudyReportDate"; break;
                case "Inicio Proceso": key = "processStartDate"; break;
                case "Días Inicio Proceso": key = "processStartDays"; break;
                case "Cert Planificación": key = "planningCertDate"; break;
                case "Días Planificación": key = "planningDays"; break;
                case "Cert Compras": key = "procurementCertDate"; break;
                case "Días Compras": key = "procurementDays"; break;
                case "Cert Financiero": key = "financialCertDate"; break;
                case "Días Financiero": key = "financialDays"; break;
                case "Cert Delegado": key = "delegateCertDate"; break;
                case "Días Delegado": key = "delegateDays"; break;
                case "Cert Jurídico": key = "legalCertDate"; break;
                case "Días Jurídico": key = "legalDays"; break;
                case "Cert Adjudicado": key = "awardedCertDate"; break;
                case "Días Adjudicada": key = "awardedDays"; break;
                case "Monto Adjudicado": key = "finalAwardedAmount"; break;
                default: key = header;
            }

            let value = row[index];
            if (DATE_FIELDS.includes(key)) {
                value = formatDateForApp(value);
            }
            // Skip formula error values if any
            if (value === "#NUM!" || value === "#VALUE!" || value === "#DIV/0!") {
                value = "";
            }
            obj[key] = value;
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(jsonInfo))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const sheet = getOrCreateSheet();
        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        if (action === "add") {
            const payload = data.payload;

            // Current row index for formulas (Last row + 1)
            const rowIdx = sheet.getLastRow() + 1;

            // Column mapping (sin Días Est. Mercado):
            // A=ID, B=Proceso, C=Presupuesto, D=Fecha Creación
            // E=Informe Est. Mercado
            // F=Inicio Proceso, G=Días Inicio Proceso
            // H=Cert Planificación, I=Días Planificación
            // J=Cert Compras, K=Días Compras
            // L=Cert Financiero, M=Días Financiero
            // N=Cert Delegado, O=Días Delegado
            // P=Cert Jurídico, Q=Días Jurídico
            // R=Cert Adjudicado, S=Días Adjudicada
            // T=Monto Adjudicado
            const newRow = HEADERS.map(header => {
                switch (header) {
                    case "ID": return payload["id"] || "";
                    case "Proceso": return payload["name"] || "";
                    case "Presupuesto": return payload["budget"] || "";
                    case "Fecha Creación": return formatDateForSheet(payload["createdAt"]);

                    case "Informe Est. Mercado":
                        return formatDateForSheet(payload["marketStudyReportDate"]); // Col E

                    case "Inicio Proceso":
                        return formatDateForSheet(payload["processStartDate"]); // Col F
                    case "Días Inicio Proceso":
                        // Inicio (F) - Est.Mercado (E)
                        return `=IF(OR(ISBLANK(F${rowIdx}), ISBLANK(E${rowIdx})), "", F${rowIdx}-E${rowIdx})`;

                    case "Cert Planificación":
                        return formatDateForSheet(payload["planningCertDate"]); // Col H
                    case "Días Planificación":
                        // Plan (H) - Inicio (F)
                        return `=IF(OR(ISBLANK(H${rowIdx}), ISBLANK(F${rowIdx})), "", H${rowIdx}-F${rowIdx})`;

                    case "Cert Compras":
                        return formatDateForSheet(payload["procurementCertDate"]); // Col J
                    case "Días Compras":
                        // Compras (J) - Plan (H)
                        return `=IF(OR(ISBLANK(J${rowIdx}), ISBLANK(H${rowIdx})), "", J${rowIdx}-H${rowIdx})`;

                    case "Cert Financiero":
                        return formatDateForSheet(payload["financialCertDate"]); // Col L
                    case "Días Financiero":
                        // Fin (L) - Compras (J)
                        return `=IF(OR(ISBLANK(L${rowIdx}), ISBLANK(J${rowIdx})), "", L${rowIdx}-J${rowIdx})`;

                    case "Cert Delegado":
                        return formatDateForSheet(payload["delegateCertDate"]); // Col N
                    case "Días Delegado":
                        // Del (N) - Fin (L)
                        return `=IF(OR(ISBLANK(N${rowIdx}), ISBLANK(L${rowIdx})), "", N${rowIdx}-L${rowIdx})`;

                    case "Cert Jurídico":
                        return formatDateForSheet(payload["legalCertDate"]); // Col P
                    case "Días Jurídico":
                        // Jur (P) - Del (N)
                        return `=IF(OR(ISBLANK(P${rowIdx}), ISBLANK(N${rowIdx})), "", P${rowIdx}-N${rowIdx})`;

                    case "Cert Adjudicado":
                        return formatDateForSheet(payload["awardedCertDate"]); // Col R
                    case "Días Adjudicada":
                        // Adj (R) - Jur (P)
                        return `=IF(OR(ISBLANK(R${rowIdx}), ISBLANK(P${rowIdx})), "", R${rowIdx}-P${rowIdx})`;

                    case "Monto Adjudicado":
                        return payload["finalAwardedAmount"] || "";
                }
                return "";
            });
            sheet.appendRow(newRow);
            return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Proceso agregado" }))
                .setMimeType(ContentService.MimeType.JSON);

        } else if (action === "update") {
            const payload = data.payload;
            const stage = data.stage;
            const id = payload.id;
            const range = sheet.getDataRange();
            const values = range.getValues();

            let targetHeader = "";
            switch (stage) {
                case "marketStudyReportDate": targetHeader = "Informe Est. Mercado"; break;
                case "processStartDate": targetHeader = "Inicio Proceso"; break;
                case "planningCertDate": targetHeader = "Cert Planificación"; break;
                case "delegateCertDate": targetHeader = "Cert Delegado"; break;
                case "legalCertDate": targetHeader = "Cert Jurídico"; break;
                case "procurementCertDate": targetHeader = "Cert Compras"; break;
                case "awardedCertDate": targetHeader = "Cert Adjudicado"; break;
                case "financialCertDate": targetHeader = "Cert Financiero"; break;
                case "finalAwardedAmount": targetHeader = "Monto Adjudicado"; break;
            }

            let colIndex = -1;
            if (targetHeader) {
                colIndex = values[0].indexOf(targetHeader);
            }

            let rowIndex = -1;
            for (let i = 1; i < values.length; i++) {
                if (values[i][0] == id) {
                    rowIndex = i + 1;
                    break;
                }
            }

            if (rowIndex !== -1 && colIndex !== -1) {
                let valueToSet = payload.value;
                if (DATE_FIELDS.includes(stage)) {
                    valueToSet = formatDateForSheet(valueToSet);
                }
                sheet.getRange(rowIndex, colIndex + 1).setValue(valueToSet);
                return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Proceso actualizado" }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        } else if (action === "delete") {
            const id = data.payload.id;
            const range = sheet.getDataRange();
            const values = range.getValues();

            let rowIndex = -1;
            for (let i = 1; i < values.length; i++) {
                if (values[i][0] == id) {
                    rowIndex = i + 1;
                    break;
                }
            }

            if (rowIndex !== -1) {
                sheet.deleteRow(rowIndex);
                return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Proceso eliminado" }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        }

        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Acción no reconocida o no encontrada" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: e.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}
