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

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TsweeklyRepository } from './tsweekly.repository';
import { FilterTsweeklyDto } from './dto/filter-tsweekly.dto';
import { Tsweekly } from './tsweekly.entity';
import { CreateTsweeklyDto } from './dto/create-tsweekly.dto';
import { UpdateTsweeklyDto } from './dto/update-tsweekly.dto';
import { UpdateResult } from 'typeorm';

@Injectable()
export class TsweeklyService {

  constructor(
    @InjectRepository(TsweeklyRepository)
    private tsweeklyRepository: TsweeklyRepository) {}

  /**
   * Returns a Promise of an array of Tsweekly based on filter. One to many Tsweekly can be returned.
   * @param filterTsweeklyDto
   */
  async getTsweekly(filterTsweeklyDto: FilterTsweeklyDto): Promise<Tsweekly[]> {
    return this.tsweeklyRepository.getTsweekly(filterTsweeklyDto);
  }

  async getTsweeklyById(emailId: string): Promise<Tsweekly[]> {
    return this.tsweeklyRepository.getTsweeklyById(emailId);
  }

  async createTsweekly(createTsweeklyDto: CreateTsweeklyDto): Promise<void> {
    return this.tsweeklyRepository.createTsweekly(createTsweeklyDto);
  }

  // async updateTsweeklyUser(token, emailId: string, weekId: number): Promise<UpdateResult> {
  //
        // token check
  //   // check userSigned == null
            // check if signed date in database and admin has not signed
  //          // Move document to old folder
  //          // remove preview
  //
  //   //else
          // check if signed date in database
  //        // create document and save to gdrive //string
  //        // create preview                     //string
  //
  //   return this.tsweeklyRepository.updateTsweeklyUser(emailId, weekId, newUpdateTsweeklyDto);
  // }
}