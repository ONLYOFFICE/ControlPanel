/*
 *
 * (c) Copyright Ascensio System Limited 2010-2021
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/


const BaseModel = require('./base.js');

const ldapCertificateProblem = {
    CertExpired: -2146762495,
    CertValidityPeriodNesting: -2146762494,
    CertRole: -2146762493,
    CertPathLenConst: -2146762492,
    CertCritical: -2146762491,
    CertPurpose: -2146762490,
    CertIssuerChaining: -2146762489,
    CertMalformed: -2146762488,
    CertUntrustedRoot: -2146762487,
    CertChainnig: -2146762486,
    CertRevoked: -2146762484,
    CertUntrustedTestRoot: -2146762483,
    CertRevocationFailure: -2146762482,
    CertCnNoMatch: -2146762481,
    CertWrongUsage: -2146762480,
    CertUntrustedCa: -2146762478,
    CertUnrecognizedError: -2146762477
}

class ldapModel extends BaseModel {
    constructor(req, title) {
        super(req, title);

        this.enableLdapAuthentication = false;
        this.startTls = false;
        this.ssl = false;
        this.sendWelcomeEmail = false;
        this.server = "";
        this.userDN = "";
        this.portNumber = "";
        this.userFilter = "";
        this.loginAttribute = "";
        this.ldapMapping = {};
        this.accessRights = {};
        this.groupMembership = false;
        this.groupDN = "";
        this.groupNameAttribute = "";
        this.groupFilter = "";
        this.userAttribute = "";
        this.groupAttribute = "";
        this.authentication = false;
        this.login = "";
        this.password = "";
        this.passwordBytes = [];
        this.isDefault = false;
    }

    static mapError(error, CPLdapResource) {
        switch (error) {
            case ldapCertificateProblem.CertExpired:
                return CPLdapResource.LdapSettingsCertExpired;
            case ldapCertificateProblem.CertCnNoMatch:
                return CPLdapResource.LdapSettingsCertCnNoMatch;
            case ldapCertificateProblem.CertIssuerChaining:
                return CPLdapResource.LdapSettingsCertIssuerChaining;
            case ldapCertificateProblem.CertUntrustedCa:
                return CPLdapResource.LdapSettingsCertUntrustedCa;
            case ldapCertificateProblem.CertUntrustedRoot:
                return CPLdapResource.LdapSettingsCertUntrustedRoot;
            case ldapCertificateProblem.CertMalformed:
                return CPLdapResource.LdapSettingsCertMalformed;
            case ldapCertificateProblem.CertUnrecognizedError:
                return CPLdapResource.LdapSettingsCertUnrecognizedError;
            case ldapCertificateProblem.CertValidityPeriodNesting:
            case ldapCertificateProblem.CertRole:
            case ldapCertificateProblem.CertPathLenConst:
            case ldapCertificateProblem.CertCritical:
            case ldapCertificateProblem.CertPurpose:
            case ldapCertificateProblem.CertChainnig:
            case ldapCertificateProblem.CertRevoked:
            case ldapCertificateProblem.CertUntrustedTestRoot:
            case ldapCertificateProblem.CertRevocationFailure:
            case ldapCertificateProblem.CertWrongUsage:
                return "";
        }

        return "";
    }
}

module.exports = ldapModel;