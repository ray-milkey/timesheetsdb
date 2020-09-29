/*
 * Copyright 2020-present Open Networking Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EntityRepository, getConnection, Repository, UpdateResult } from 'typeorm';
import { TsWeekly } from './tsweekly.entity';
import { CreateTsWeeklyDto } from './dto/create-tsweekly.dto';
import { BadRequestException, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { UpdateTsWeeklyDto } from './dto/update-tsweekly.dto';
import { TsUser } from '../auth/tsuser.entity';
import { TsDay } from '../tsday/tsday.entity';
import { TsWeek } from '../tsweek/tsweek.entity';
import { signingViaEmail } from './docusign/send-email-sign';

@EntityRepository(TsWeekly)
export class TsWeeklyRepository extends Repository<TsWeekly> {

  async createTsWeekly(tsUser: TsUser, createTsWeeklyDto: CreateTsWeeklyDto): Promise<void> {

    const { weekId } = createTsWeeklyDto;

    const tsWeekly = new TsWeekly();
    tsWeekly.weekId = weekId;
    tsWeekly.tsUser = tsUser;

    try {

      await tsWeekly.save();

    }catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTsWeekly(tsUser: TsUser): Promise<TsWeekly[]> {

    return await this.find({ where: { tsUser: tsUser } });

    // Go through and convert blob
    // blobToFile ( ... );

  }

  async updateTsWeeklyUser(token, tsUser: TsUser, weekId: number, updateTsWeeklyDto: UpdateTsWeeklyDto): Promise<UpdateResult> {

    const tsWeeklySigned = await this.findOne({ where: { tsUser: tsUser, weekId: weekId } })

    // Testing
    // const days = await getConnection().getRepository(TsDay).find({ where: { tsUser: tsUser, weekId: weekId }})
    // const week = await getConnection().getRepository(TsWeek).findOne({ where: { id: weekId }})
    // const admin = await getConnection().getRepository(TsUser).findOne({ where: { email: tsUser.supervisorEmail }})
    //
    // const htmlArgs = {
    //   submitterEmail: tsUser.email,
    //   submitterName: tsUser.firstName + " " + tsUser.lastName,
    //   supervisorEmail: admin.email,
    //   supervisorName: admin.firstName + " " + admin.lastName,
    //   week: week,
    //   hours: null
    //   },
    //   args = {
    //     days: days,
    //     token: token,
    //     htmlArgs: htmlArgs
    //   }
    //
    // // const stuff = TsWeeklyService.createPdf(days, week);
    //
    // const envelopeId = await this.sendEmail(args);
    //
    // return ;

    let signed;

    // check admin has signed
    if(tsWeeklySigned.adminSigned){
      throw new BadRequestException("Admin has signed");
    }

    let { document, preview, userSigned } = updateTsWeeklyDto;

    // check user has requested to sign and if its already been signed
    if(userSigned && tsWeeklySigned.userSigned){
      throw new BadRequestException("Already signed");
    }

    // check user has requested to unsign and if it is not signed
    if(!userSigned && !tsWeeklySigned.userSigned){
      throw new BadRequestException("Has not been signed");
    }

    if(userSigned) {

      const week = await getConnection().getRepository(TsWeek).findOne({ where: { id: weekId }})
      const days = await getConnection().getRepository(TsDay).find({ where: { tsUser: tsUser, weekId: weekId }})
      const admin = await getConnection().getRepository(TsUser).findOne({ where: { email: tsUser.supervisorEmail }})

      const htmlArgs = {
        signerEmail: tsUser.email,
        signerName: tsUser.firstName + " " + tsUser.lastName,
        supervisorEmail: admin.email,
        supervisorName: admin.firstName + " " + admin.lastName,
        days: days,
        week: week,
        hours: null
        },
        args = {
          days: days,
          htmlArgs: htmlArgs
        }

      // const stuff = await TsWeeklyService.createPdf(days, week);

      const envelopeId = await this.sendEmail(args);
      signed = envelopeId.envelopeId.envolopeId.envelopeId;
    }
    else{

      // save document to backup
      document = null;

      preview = null;

      userSigned = null;

    }

    return await this.update(
      {
        tsUser: tsUser,
        weekId: weekId
      }, {
        document: document,
        preview: preview,
        userSigned: signed
    });
  }

  async updateTsWeeklyAdmin(tsUserAdmin: TsUser, emailId: string, weekId: number, updateTsWeeklyDto: UpdateTsWeeklyDto): Promise<UpdateResult> {

    if(!tsUserAdmin.isSupervisor){
      throw new UnauthorizedException();
    }

    let signed;
    const getUser = new TsUser();
    getUser.email = emailId;

    const isUserSupervisor = await this.findOne({ where: { tsUser: emailId, weekId: weekId } });

    if(String(isUserSupervisor.tsUser) !== tsUserAdmin.email && !isUserSupervisor.userSigned){
      throw new UnauthorizedException();
    }

    const { adminSigned } = updateTsWeeklyDto;

    // check admin has requested to sign and if its already been signed
    if(adminSigned && isUserSupervisor.adminSigned){
      throw new BadRequestException("Already signed");
    }

    // check admin has requested to unsign and if it is not signed
    if(!adminSigned && !isUserSupervisor.adminSigned){
      throw new BadRequestException("Has not been signed");
    }

    if(adminSigned){
      signed = new Date();
    }
    else {
      signed = null;
    }

    return await this.update(
      {
        tsUser: isUserSupervisor.tsUser,
        weekId: weekId
      }, {
        adminSigned: signed
      });
  }

  async sendEmail(args){

    const cellValues = [];
    for(let i = 0; i < 7; i++){

      cellValues[i] = [];

      cellValues[i][0] = args.days[i].darpaMins / 60
      cellValues[i][1] = args.days[i].nonDarpaMins / 60;
      cellValues[i][2] = args.days[i].sickMins / 60
      cellValues[i][3] = args.days[i].ptoMins / 60
      cellValues[i][4] = args.days[i].holidayMins / 60
      cellValues[i][5] = (args.days[i].darpaMins / 60) + (args.days[i].nonDarpaMins / 60) + (args.days[i].sickMins / 60) + (args.days[i].ptoMins / 60) + (args.days[i].holidayMins / 60);
    }
    cellValues[7] = [];
    for(let i = 0; i < 6; i++){

      cellValues[7][i] = cellValues[0][i] + cellValues[1][i] + cellValues[2][i] + cellValues[3][i] +
        cellValues[4][i] + cellValues[5][i] + cellValues[6][i];
    }
    for(let i = 0; i < cellValues.length; i++){
      for(let j = 0; j < cellValues[i].length; j++){

        cellValues[i][j] = cellValues[i][j].toString();
      }
    }

    args.htmlArgs.hours = cellValues;
    args.htmlArgs.week.begin = TsWeeklyRepository.dateFormat(args.htmlArgs.week.begin);
    args.htmlArgs.week.end = TsWeeklyRepository.dateFormat(args.htmlArgs.week.end);

    return await signingViaEmail.controller(args.token.data.access_token, args);
  }

  private static dateFormat(date: string): string{

    const dateArr = date.split("-");

    // month/day/year
    return dateArr[1] + "/" + dateArr[2] + "/" +dateArr[0] ;
  }
}